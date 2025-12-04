import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import AttendedShows from './AttendedShows';
import AttendedByGroupChart from './AttendedByGroupChart';
import AttendanceStats from './AttendanceStats';
import UserSongs from './UserSongs';
import UserSongMatrix from './UserSongMatrix';
import UserSongToggleSwitch from './UserSongToggleSwitch';
import UserSlots from './UserSlots';
import UserGuests from './UserGuests';
import OverviewChart from './OverviewChart';
import UserStats from './UserStats';
import LooseEnds from './LooseEnds';
import { ChevronDown, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Helper functions to convert between tab names and URL slugs
const tabToSlug = (tab: string): string => {
  return tab.toLowerCase().replace(/\s+/g, '-');
};

const slugToTab = (slug: string): string => {
  const tabMap: { [key: string]: string } = {
    'overview': 'Overview',
    'shows': 'Shows',
    'songs': 'Songs',
    'slots': 'Slots',
    'personnel': 'Personnel',
    'loose-ends': 'Loose Ends'
  };
  return tabMap[slug] || 'Overview';
};

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSongMatrix, setShowSongMatrix] = useState(false);
  const [songIdMap, setSongIdMap] = useState<{[songName: string]: string}>({});
  const [yearIdMap, setYearIdMap] = useState<{[year: string]: string}>({});
  const [isManagingShows, setIsManagingShows] = useState(false);
  const [shareButtonText, setShareButtonText] = useState(window.innerWidth < 768 ? 'Share' : 'Share My Stats');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [shareButtonColor, setShareButtonColor] = useState('bg-fourth text-white font-medium');
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Add this in the Profile component
  useEffect(() => {
    const checkDatabaseRecords = async () => {
      try {
        await supabase
          .from('user_attended_shows')
          .select('*')
          .eq('user_id', '75f1ef5d-6b9a-4064-9b21-8b8550dc34bc');
        
        if (user) {
          // Also check with the current logged-in user ID
          await supabase
            .from('user_attended_shows')
            .select('*')
            .eq('user_id', user.id);
        }
      } catch (e) {
        console.error('Error checking database records:', e);
      }
    };
    
    checkDatabaseRecords();
  }, [user]);

  // Fetch song and year maps for navigation
  useEffect(() => {
    async function fetchMappings() {
      try {
        // Fetch song id mappings
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('song, song_id');
          
        if (songsError) throw songsError;
        
        const songMap: {[songName: string]: string} = {};
        if (songsData) {
          songsData.forEach(song => {
            songMap[song.song] = song.song_id;
          });
        }
        setSongIdMap(songMap);
        
        // Fetch year id mappings
        const { data: yearsData, error: yearsError } = await supabase
          .from('years')
          .select('year, year_id');
          
        if (yearsError) throw yearsError;
        
        const yearMap: {[year: string]: string} = {};
        if (yearsData) {
          yearsData.forEach(year => {
            yearMap[year.year] = year.year_id;
          });
        }
        setYearIdMap(yearMap);
      } catch (error) {
        console.error('Error fetching mapping data:', error);
      }
    }
    
    fetchMappings();
  }, []);

  const handleShareStats = async () => {
    if (user) {
      const shareUrl = `https://dripfield.pro/user/${user.id}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        // Change button text and color to indicate success
        setShareButtonText(isMobile ? 'Copied!' : 'Link copied to clipboard!');
        setShareButtonColor('bg-green-500');
        
        // Reset button after 2 seconds
        setTimeout(() => {
          setShareButtonText(isMobile ? 'Share' : 'Share My Stats');
          setShareButtonColor('bg-fourth text-white font-medium');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const tabs = ['Overview', 'Shows', 'Songs', 'Slots', 'Personnel', 'Loose Ends'];

  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam) {
      const tabFromUrl = slugToTab(tabParam);
      if (tabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      } else {
        // Invalid tab in URL, redirect to overview
        navigate('/profile/overview', { replace: true });
      }
    } else {
      // No tab in URL, default to overview and update URL
      if (location.pathname === '/profile') {
        navigate('/profile/overview', { replace: true });
      } else {
        setActiveTab('Overview');
      }
    }
  }, [tabParam, navigate, location.pathname]);

  // Handle tab change - update URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const slug = tabToSlug(tab);
    navigate(`/profile/${slug}`, { replace: true });
  };

  // Handle click outside to close dropdown and check for screen size changes
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    function handleResize() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShareButtonText(mobile ? 'Share' : 'Share My Stats');
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

  // Handle show management mode toggling from child components
  const handleShowManagementToggle = (isManaging: boolean) => {
    setIsManagingShows(isManaging);
  };

  // Make sure we have a user
  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div>
            <div className="grid grid-cols-1 gap-4">
              <OverviewChart userId={user.id} />
              <UserStats userId={user.id} />
            </div>
          </div>
        );
      case 'Shows':
        return (
          <div>
            <AttendedShows userId={user.id} readOnly={false} onManagingToggle={handleShowManagementToggle} />
            {!isManagingShows && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                <div className="lg:col-span-2">
                  <AttendedByGroupChart userId={user.id} />
                </div>
                <div className="lg:col-span-3">
                  <AttendanceStats userId={user.id} />
                </div>
              </div>
            )}
          </div>
        );
      case 'Songs':
        return (
          <div>
            <div className="flex justify-between items-center mb-4 bg-tertiary border border-fourth shadow-xl">
              <h3 className="text-sm font-semibold text-fifth px-2 py-0.5">Songs Seen</h3>
              <UserSongToggleSwitch
                isRight={showSongMatrix}
                onToggle={setShowSongMatrix}
                className="mr-2"
              />
            </div>
            {showSongMatrix ? 
              <UserSongMatrix 
                userId={user.id}
                songIdMap={songIdMap} 
                yearIdMap={yearIdMap}
              /> : 
              <UserSongs userId={user.id} />
            }
          </div>
        );
      case 'Slots':
        return (
          <div>
            <UserSlots userId={user.id} />
          </div>
        );
      case 'Personnel':
        return (
          <div>
            <UserGuests userId={user.id} />
          </div>
        );
      case 'Loose Ends':
        return (
          <div>
            <LooseEnds userId={user.id} />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5 border border-fourth shadow-xl">My Stats</h2>
          <button
            onClick={handleShareStats}
            className={`flex items-center gap-1 px-2 py-0.5 ${shareButtonColor} text-fifth text-sm font-semibold transition-colors duration-200 hover:opacity-90 border border-fourth shadow-xl`}
          >
            <Link2 className="w-4 h-4" />
            <span className='font-medium'>{shareButtonText}</span>
          </button>
        </div>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-tertiary text-fifth text-sm font-semibold border border-fourth"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-4 py-1 bg-primary border border-fourth shadow-xl z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    handleTabChange(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-0.5 text-xs font-light text-fifth hover:bg-tertiary/40 transition-colors ${
                    activeTab === tab ? 'bg-tertiary/80 font-medium' : ''
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
          <div className="bg-primary border border-fourth shadow-xl">
            <div className="flex relative">
              {tabs.map((tab, index) => (
                <button
                  key={tab}
                  ref={el => tabsRef.current[index] = el}
                  onClick={() => handleTabChange(tab)}
                  className={`py-0.5 px-2 font-medium relative z-10 text-xs transition-colors duration-200 ${
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
                className="absolute h-5 bg-tertiary top-0 transition-all duration-300 ease-in-out"
                style={{ left: 0, width: '100px' }} // Initial values, will be updated by useEffect
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="mt-4">
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;