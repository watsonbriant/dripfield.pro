import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AdminArtist } from './AdminArtist';
import { AdminSong } from './AdminSong';
import { AdminSetlist } from './AdminSetlist'; 
import { ChevronDown } from 'lucide-react';
import { AdminGuest } from './AdminGuest';
import { AdminShow } from './AdminShow';
import { AdminChanges } from './AdminChanges';
import { AdminReleases } from './AdminReleases';
import { AdminMedia } from './AdminMedia';
import { AdminVenue } from './AdminVenue';
import { AdminSubvenue } from './AdminSubvenue';
import { AdminWted } from './AdminWted';
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
  const tabs = useMemo(() => ['Setlist', 'Artist', 'Song', 'Guest', 'Show', 'Changes', 'Releases', 'Media', 'Venue', 'Subvenue', 'WTED'], []);

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
      const { data, error } = await supabase
        .rpc('update_all_setlist_entries');
      
      if (error) throw error;
      
      setUpdateStatus({
        type: 'success',
        message: 'Success!'
      });
      
      setTimeout(() => {
        setUpdateStatus({ type: null, message: null });
      }, 3000);
      
    } catch (error) {
      setUpdateStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update statistics. Please try again.'
      });
      console.error('Error updating statistics:', error);
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
          <div className="bg-primary border border-fourth">
            <AdminSetlist />
          </div>
        );
      case 'Artist':
        return (
          <div className="bg-primary border border-fourth">
            <AdminArtist />
          </div>
        );
      case 'Song':
        return (
          <div className="bg-primary border border-fourth">
            <AdminSong />
          </div>
        );
      case 'Guest':
        return (
          <div className="bg-primary border border-fourth">
            <AdminGuest />
          </div>
        );
      case 'Show':
        return (
          <div className="bg-primary border border-fourth">
            <AdminShow />
          </div>
        );
      case 'Changes':
        return (
          <div className="bg-primary border border-fourth">
            <AdminChanges />
          </div>
        );
      case 'Releases':
        return (
          <div className="bg-primary border border-fourth">
            <AdminReleases />
          </div>
        );
      case 'Media':
        return (
          <div className="bg-primary border border-fourth">
            <AdminMedia />
          </div>
        );
      case 'Venue':
        return (
          <div className="bg-primary border border-fourth">
            <AdminVenue />
          </div>
        );
      case 'Subvenue':
        return (
          <div className="bg-primary border border-fourth">
            <AdminSubvenue />
          </div>
        );
      case 'WTED':
        return (
          <div className="bg-primary border border-fourth">
            <AdminWted />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  }, [activeTab]);
  
  return (
    <div className="max-w-[1500px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5 rounded-lg border border-fourth">Admin Panel</h2>
          {userCount !== null && (
            <span className="bg-fourth text-white px-2 py-0.5 rounded-full text-xs font-medium border border-fourth">
              {userCount.toLocaleString()} {userCount === 1 ? 'user' : 'users'}
            </span>
          )}
        </div>
        <button
          onClick={handleUpdateStatistics}
          disabled={isUpdating || updateStatus.type === 'success'}
          className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors border border-fourth
            ${isUpdating
              ? 'bg-black/50 text-white cursor-not-allowed'
              : updateStatus.type === 'success'
              ? 'bg-blue-500 text-white'
              : 'bg-green-600 text-white hover:bg-tertiary'}`}
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
        <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-lg border border-red-300">
          Error: {updateStatus.message}
        </div>
      )}
      
      <div className="my-4 border-b border-fourth"></div>
      
      {/* Tab Navigation */}
      <div className="mt-4 flex flex-row justify-between items-center">
        <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5 rounded-lg border border-fourth">Manage Data</h2>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-tertiary hover:bg-tertiary/90 text-fifth border border-fourth font-medium text-sm"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-primary border border-fourth rounded-lg shadow-xl z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    handleTabChange(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-0.5 text-xs hover:bg-tertiary/40 transition-colors ${
                    activeTab === tab ? 'bg-tertiary/40 font-medium' : 'text-fifth'
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
          <div className="bg-primary px-1 rounded-lg border border-fourth">
            <div className="flex relative">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => handleTabChange(tab)}
                  className={`py-1 px-2 font-medium relative z-10 text-xs transition-colors duration-200 ${
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
                className="absolute h-5 bg-tertiary/80 rounded-lg top-0.5 transition-all duration-300 ease-in-out"
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