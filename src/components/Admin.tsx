console.log('Admin.tsx file executing');

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AdminArtist } from './AdminArtist';
import { AdminSong } from './AdminSong';
import { AdminSetlist } from './AdminSetlist'; 
import { ChevronDown } from 'lucide-react';
import { AdminGuest } from './AdminGuest';
import { AdminShow } from './AdminShow';
import { AdminChanges } from './AdminChanges';
import { AdminReleases } from './AdminReleases';

export function Admin() {
  console.log('Admin component rendering');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  
  // Initialize activeTab from localStorage or default to 'Setlist'
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('adminActiveTab') || 'Setlist';
    console.log('Admin: Initial activeTab from localStorage:', stored);
    return stored;
  });

  // Add mount/unmount tracker
  useEffect(() => {
    console.log('Admin component MOUNTED');
    return () => {
      console.log('Admin component UNMOUNTED');
    };
  }, []);
  
  // Log when activeTab changes
  useEffect(() => {
    console.log('Admin: activeTab changed to:', activeTab);
  }, [activeTab]);
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Memoize tabs array to prevent re-creation on each render
  const tabs = useMemo(() => ['Setlist', 'Artist', 'Song', 'Guest', 'Show', 'Changes', 'Releases'], []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Handle click outside to close dropdown and check for screen size changes
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update the indicator position when the active tab changes
  useEffect(() => {
    const activeTabElement = tabsRef.current[tabs.indexOf(activeTab)];
    const indicator = indicatorRef.current;
    
    if (activeTabElement && indicator) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      indicator.style.left = `${offsetLeft}px`;
      indicator.style.width = `${offsetWidth}px`;
    }
  }, [activeTab, tabs]);
  
  const handleUpdateStatistics = async () => {
    setIsUpdating(true);
    setUpdateStatus({ type: null, message: null });
    
    try {
      const response = await fetch('https://hook.us2.make.com/gn9grskvrkor428pac36qyixbohzyg37', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_statistics'
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setUpdateStatus({
            type: 'success',
            message: 'Success!'
          });
        } else {
          throw new Error(data.message || 'Failed.');
        }
      } else {
        // Handle non-JSON response
        const text = await response.text();
        if (response.status === 200) {
          setUpdateStatus({
            type: 'success',
            message: 'Success!'
          });
        } else {
          throw new Error(text || 'Failed to update statistics');
        }
      }
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setUpdateStatus({ type: null, message: null });
      }, 3000);
      
    } catch (error) {
      setUpdateStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to trigger statistics update. Please try again.'
      });
      console.error('Error triggering statistics update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Create a tab switching handler that updates localStorage
  const handleTabChange = (tab: string) => {
    console.log('Admin: handleTabChange called with:', tab);
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  // Use a memoized function to render tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    console.log('Admin: renderTabContent recalculating for tab:', activeTab);
    switch (activeTab) {
      case 'Setlist':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminSetlist />
          </div>
        );
      case 'Artist':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminArtist />
          </div>
        );
      case 'Song':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminSong />
          </div>
        );
      case 'Guest':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminGuest />
          </div>
        );
      case 'Show':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminShow />
          </div>
        );
      case 'Changes':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminChanges />
          </div>
        );
      case 'Releases':
        return (
          <div className="bg-primary border border-black rounded-lg p-3">
            <AdminReleases />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  }, [activeTab]);
  
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mt-2 flex justify-between items-center">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Admin Panel</h2>
        <button
          onClick={handleUpdateStatistics}
          disabled={isUpdating || updateStatus.type === 'success'}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors border border-black
            ${isUpdating
              ? 'bg-black/50 text-white cursor-not-allowed'
              : updateStatus.type === 'success'
              ? 'bg-blue-500 text-white'
              : 'bg-green-600 text-white hover:bg-green-600/50'}`}
          title="Update all setlist entries statistics"
        >
          {isUpdating
            ? 'Waiting...'
            : updateStatus.type === 'success'
            ? updateStatus.message
            : 'Update Database'}
        </button>
      </div>
      
      {updateStatus.type === 'error' && (
        <div className="mt-2 text-sm text-red-600 bg-red-100 px-3 py-1 rounded-md border border-red-300">
          Error: {updateStatus.message}
        </div>
      )}
      
      <div className="my-4 border-b border-black/20"></div>
      
      {/* Tab Navigation */}
      <div className="mt-4 flex flex-row justify-between items-center">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Manage Data</h2>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f9ae37] text-black border border-black font-semibold"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    handleTabChange(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-1 text-sm hover:bg-canvas transition-colors ${
                    activeTab === tab ? 'bg-canvas font-semibold' : 'text-black'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop Tab Navigation */}
        <div className="hidden lg:block relative">
          <div className="bg-primary px-1 py-1 rounded-full border border-black">
            <div className="flex relative">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1 px-3 font-semibold relative z-10 text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-black'
                      : 'text-black/60 hover:text-black/90'
                  }`}
                >
                  {tab}
                </button>
              ))}
              
              {/* Animated pill indicator */}
              <div 
                ref={indicatorRef}
                className="absolute h-7 bg-[#f9ae37] rounded-full top-0 transition-all duration-300 ease-in-out"
                style={{ left: 0, width: '100px' }} // Initial values, will be updated by useEffect
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="mt-4">
        {renderTabContent}
      </div>
    </div>
  );
}