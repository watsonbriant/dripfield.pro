import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ChevronDown, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MatrixSortMode } from './UserSongMatrix'; // Import the type from UserSongMatrix

export const Profile: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSongMatrix, setShowSongMatrix] = useState(false);
  const [matrixSortMode, setMatrixSortMode] = useState<MatrixSortMode>('alphabetical'); // Add matrix sort mode with proper type
  const [songIdMap, setSongIdMap] = useState<{[songName: string]: string}>({});
  const [yearIdMap, setYearIdMap] = useState<{[year: string]: string}>({});
  const [isManagingShows, setIsManagingShows] = useState(false);
  const [shareButtonText, setShareButtonText] = useState(window.innerWidth < 768 ? 'Share' : 'Share My Stats');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [shareButtonColor, setShareButtonColor] = useState('bg-tertiary');
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Add this in the Profile component
  useEffect(() => {
    const checkDatabaseRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('user_attended_shows')
          .select('*')
          .eq('user_id', '75f1ef5d-6b9a-4064-9b21-8b8550dc34bc');
        
        console.log('Records found in database for known ID:', data);
        console.log('Any errors?', error);
        
        if (user) {
          // Also check with the current logged-in user ID
          const { data: userData, error: userError } = await supabase
            .from('user_attended_shows')
            .select('*')
            .eq('user_id', user.id);
          
          console.log('Records found for current logged-in user ID:', userData);
          console.log('Any errors for current user?', userError);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
          setShareButtonColor('bg-tertiary');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  const tabs = ['Overview', 'Shows', 'Songs', 'Slots', 'Guests'];

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
            <h3 className="text-xl text-white/90 font-semibold mb-4">Profile Overview</h3>
            <div className="grid grid-cols-1 gap-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl text-white/90 font-semibold">Songs You've Seen</h3>
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
      case 'Guests':
        return (
          <div>
            <UserGuests userId={user.id} />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-row justify-between items-center mt-2">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">My Stats</h2>
          <button
            onClick={handleShareStats}
            className={`flex items-center gap-1 px-3 py-1 rounded-full ${shareButtonColor} text-white font-semibold transition-colors duration-200 hover:opacity-90`}
          >
            <Link2 className="w-4 h-4" />
            <span>{shareButtonText}</span>
          </button>
        </div>
        
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
                    setActiveTab(tab);
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
                  onClick={() => setActiveTab(tab)}
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
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;