import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LooseEnds from './LooseEnds';

export const PublicProfile: React.FC = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSongMatrix, setShowSongMatrix] = useState(false);
  const [songIdMap, setSongIdMap] = useState<{[songName: string]: string}>({});
  const [yearIdMap, setYearIdMap] = useState<{[year: string]: string}>({});
  const [isManagingShows, setIsManagingShows] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [hasAttendedShows, setHasAttendedShows] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatUsername = (username: string | null): string => {
    if (!username) return "";
    const atIndex = username.indexOf('@');
    return atIndex > 0 ? username.substring(0, atIndex) : username;
  };

  // Fetch profile username and check for attended shows
  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setError("No user ID provided");
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch the username
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching username:', error);
          setError("Could not find user");
          setIsLoading(false);
          return;
        }
        
        if (data?.username) {
          setProfileUsername(data.username);
        } else {
          setError("User not found");
          setIsLoading(false);
          return;
        }

        // Check if user has attended shows
        const { data: showsData, error: showsError } = await supabase
          .from('user_attended_shows')
          .select('count')
          .eq('user_id', userId);
        
        if (showsError) {
          console.error('Error checking attended shows:', showsError);
        } else {
          setHasAttendedShows(showsData && showsData.length > 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error in username fetch:', error);
        setError("An error occurred");
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, [userId]);

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

  const tabs = ['Overview', 'Shows', 'Songs', 'Slots', 'Personnel', 'Loose Ends'];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div>
            <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">Profile Overview</h3>
            <div className="grid grid-cols-1 gap-6">
              <OverviewChart userId={userId} />
              <UserStats userId={userId} showCopyButton={false} />
            </div>
          </div>
        );
      case 'Shows':
        return (
          <div>
            <AttendedShows userId={userId} readOnly={true} onManagingToggle={handleShowManagementToggle} />
            {!isManagingShows && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
                <div className="lg:col-span-2">
                  <AttendedByGroupChart userId={userId} />
                </div>
                <div className="lg:col-span-3">
                  <AttendanceStats userId={userId} />
                </div>
              </div>
            )}
          </div>
        );
      case 'Songs':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">Songs Seen</h3>
              <UserSongToggleSwitch
                isRight={showSongMatrix}
                onToggle={setShowSongMatrix}
                className="mr-2"
              />
            </div>
            {showSongMatrix ? 
              <UserSongMatrix 
                userId={userId}
                songIdMap={songIdMap} 
                yearIdMap={yearIdMap}
              /> : 
              <UserSongs userId={userId} />
            }
          </div>
        );
      case 'Slots':
        return (
          <div>
            <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">Slots</h3>
            <UserSlots userId={userId} />
          </div>
        );
      case 'Personnel':
        return (
          <div>
            <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">Personnel Seen</h3>
            <UserGuests userId={userId} />
          </div>
        );
      case 'Loose Ends':
        return (
          <div>
            <LooseEnds userId={userId} />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto flex items-center justify-center h-64">
        <div className="font-semibold bg-tertiary text-fifth px-4 py-2 rounded-full border border-secondary">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto mt-8">
        <div className="bg-white/20 border border-secondary rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-full border border-secondary mb-2">Error</h3>
          <p className="text-fifth/80">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-fifth rounded-full border border-secondary font-semibold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // If the user is viewing their own profile, redirect to the profile page
  if (user && user.id === userId) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-3xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">
          {formatUsername(profileUsername)}'s Stats
        </h2>
        
        {/* Mobile Dropdown */}
        <div className="lg:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-tertiary text-fifth font-medium border border-secondary"
          >
            {activeTab}
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-4 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 w-40">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-0.5 text-sm font-light text-fifth hover:bg-canvas transition-colors ${
                    activeTab === tab ? 'bg-canvas font-medium' : ''
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
                  onClick={() => setActiveTab(tab)}
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
                className="absolute h-7 bg-tertiary rounded-lg top-0 transition-all duration-300 ease-in-out border border-secondary"
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

export default PublicProfile;