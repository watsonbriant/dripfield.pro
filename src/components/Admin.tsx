import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AdminArtist } from './AdminArtist';
import { AdminSong } from './AdminSong';
import { AdminSetlist } from './AdminSetlist'; 
import { ChevronDown } from 'lucide-react';
import { AdminGuest } from './AdminGuest';
import { AdminShow } from './AdminShow';
import { AdminChanges } from './AdminChanges';
import { AdminReleases } from './AdminReleases';
import { AdminVenue } from './AdminVenue';
import { AdminSubvenue } from './AdminSubvenue';
import { supabase } from '../lib/supabase';

export function Admin() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  
  const [userCount, setUserCount] = useState<number | null>(null);
  
  // Initialize activeTab from localStorage or default to 'Setlist'
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('adminActiveTab') || 'Setlist';
    return stored;
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  
  // Memoize tabs array to prevent re-creation on each render
  const tabs = useMemo(() => ['Setlist', 'Artist', 'Song', 'Guest', 'Show', 'Changes', 'Releases', 'Venue', 'Subvenue'], []);

  // Fetch user count on component mount
  useEffect(() => {
    async function fetchUserCount() {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching user count:', error);
          return;
        }
        
        setUserCount(count);
      } catch (error) {
        console.error('Error in fetchUserCount:', error);
      }
    }

    fetchUserCount();
  }, []);

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
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  // Use a memoized function to render tab content to prevent unnecessary re-renders
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'Setlist':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminSetlist />
          </div>
        );
      case 'Artist':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminArtist />
          </div>
        );
      case 'Song':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminSong />
          </div>
        );
      case 'Guest':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminGuest />
          </div>
        );
      case 'Show':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminShow />
          </div>
        );
      case 'Changes':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminChanges />
          </div>
        );
      case 'Releases':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminReleases />
          </div>
        );
      case 'Venue':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminVenue />
          </div>
        );
      case 'Subvenue':
        return (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <AdminSubvenue />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  }, [activeTab]);
  
  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Admin Panel</h2>
          {userCount !== null && (
            <span className="bg-fourth text-primary px-3 py-1 rounded-full text-sm font-medium border border-secondary">
              {userCount.toLocaleString()} {userCount === 1 ? 'user' : 'users'}
            </span>
          )}
        </div>
        <button
          onClick={handleUpdateStatistics}
          disabled={isUpdating || updateStatus.type === 'success'}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors border border-secondary
            ${isUpdating
              ? 'bg-black/50 text-primary cursor-not-allowed'
              : updateStatus.type === 'success'
              ? 'bg-blue-500 text-primary'
              : 'bg-green-600 text-primary hover:bg-tertiary'}`}
          title="Update all setlist entries statistics"
        >
          {isUpdating
            ? 'Waiting...'
            : updateStatus.type === 'success'
            ? updateStatus.message
            : 'Update'}
        </button>
      </div>
      
      {updateStatus.type === 'error' && (
        <div className="mt-2 text-sm text-red-600 bg-red-100 px-3 py-1 rounded-md border border-red-300">
          Error: {updateStatus.message}
        </div>
      )}
      
      <div className="my-4 border-b border-secondary"></div>
      
      {/* Tab Navigation */}
      <div className="mt-4 flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Manage Data</h2>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-tertiary hover:bg-tertiary/80 text-fifth border border-secondary font-medium"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    handleTabChange(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-1 text-sm hover:bg-canvas transition-colors ${
                    activeTab === tab ? 'bg-canvas font-medium' : 'text-fifth'
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
          <div className="bg-primary px-1 py-1 rounded-lg border border-secondary">
            <div className="flex relative">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1 px-3 font-medium relative z-10 text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-fifth'
                      : 'text-fifth hover:underline'
                  }`}
                >
                  {tab}
                </button>
              ))}
              
              {/* Animated pill indicator */}
              <div 
                ref={indicatorRef}
                className="absolute h-7 bg-tertiary/80 rounded-lg top-0 transition-all duration-300 ease-in-out"
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