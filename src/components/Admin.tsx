import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AdminArtist } from './AdminArtist';
import { AdminSong } from './AdminSong';
import { AdminSetlist } from './AdminSetlist'; 
import { ChevronDown } from 'lucide-react';
import { AdminGuest } from './AdminGuest';

export function Admin() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  
  // Initialize activeTab from localStorage or default to 'Setlist'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'Setlist';
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Memoize tabs array to prevent re-creation on each render
  const tabs = useMemo(() => ['Setlist', 'Artist', 'Song', 'Guest'], []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  // Handle visibility change to prevent unnecessary refreshes
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        console.log('Tab is now visible - maintaining current state');
        
        // Ensure the active tab matches what's in localStorage
        // This helps if the app got refreshed in the background
        const storedTab = localStorage.getItem('adminActiveTab');
        if (storedTab && storedTab !== activeTab) {
          setActiveTab(storedTab);
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  // Use a memoized function to render tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'Setlist':
        return (
          <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
            <AdminSetlist />
          </div>
        );
      case 'Artist':
        return (
          <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
            <AdminArtist />
          </div>
        );
      case 'Song':
        return (
          <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
            <AdminSong />
          </div>
        );
      case 'Guest':
        return (
          <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
            <AdminGuest />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  }, [activeTab]);
  
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="mt-2 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Panel</h1>
        <button
          onClick={handleUpdateStatistics}
          disabled={isUpdating || updateStatus.type === 'success'}
          className={`px-3 py-1 rounded text-sm text-white font-medium transition-colors
            ${isUpdating
              ? 'bg-tertiary/50 cursor-not-allowed'
              : updateStatus.type === 'success'
              ? 'bg-green-500'
              : 'bg-tertiary hover:bg-tertiary/80'}`}
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
        <div className="mt-2 text-sm text-red-400">
          Error: {updateStatus.message}
        </div>
      )}
      
      <div className="my-4 border-b border-white/10"></div>
      
      {/* Tab Navigation */}
      <div className="mt-4 flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-white/90">Manage Data</h2>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary text-white font-semibold"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-4 py-1 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    handleTabChange(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors ${
                    activeTab === tab ? 'bg-surface-secondary' : ''
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
          <div className="bg-[#172330] px-1 py-1 rounded-full border border-white/10">
            <div className="flex relative">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1 px-3 font-semibold relative z-10 text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  {tab}
                </button>
              ))}
              
              {/* Animated pill indicator */}
              <div 
                ref={indicatorRef}
                className="absolute h-7 bg-tertiary rounded-full top-0 transition-all duration-300 ease-in-out"
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