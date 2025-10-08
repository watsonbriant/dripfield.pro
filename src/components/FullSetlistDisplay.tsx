import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShowStats from './ShowStats';
import SongSpread from './SongSpread';
import { Pen, User, MoveRight } from 'lucide-react';
import ReleaseContainer from './ReleaseContainer';
import ShowInfoContent from './ShowInfoContent';
import ShowChanges from './ShowChanges';
import { supabase } from '../lib/supabase';
import { GiWhistle } from "react-icons/gi";
import SongTourPerformancesModal from './SongTourPerformancesModal';
import JOTYBadge from './JOTYBadge';

interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string; 
}
 
interface Show {
  show_id: string;
  show_date: string;
  show_group: string;
  show_detail: string | null;
  show_subvenue: string;
  show_venue_location: string;
  show_alert: string | null;
  show_coachnotes: string | null;
  show_canonid: number | null;
  show_tour: string | null;
  show_callbacks: string | null;
  tour_showfields: boolean;
  tour_id: string;
  show_wl_link?: string | null; 
  rating_visibility?: boolean;
}

interface SetlistEntry {
  entry_id: string;
  entry_set: string;
  entry_setnum: number;
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_length: string | null;
  entry_placement: string;
  entry_coachnotes: string | null;
  entry_setorder: number;
  entry_show: string;
  song_tour_count: string | null;
  last_count: string | null;
  song_id: string;
  last_show_id: string | null;
  last_show_tour: string | null;
  last_show_subvenue: string | null;
  last_venue: string | null;
  last_venue_location: string | null;
  last_show_date: string | null;
  times_played: string | null;
  shows_since_debut: string | null;
  song_rarity_percentage: string | null;
  times_played_num: number | null;
  shows_since_debut_num: number | null;
  guests: {
    guest_display_name: string;
    guest_id: string;
    guest_canonid: number;
    guest_instrument: string; 
  }[];
  song_category: string;
  category_canonid: number;
  joty_round?: string | null;
}

interface GuestGroup {
  color: string;
  guests: Guest[];
}

interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_canonid: number | null;
}

interface FullSetlistDisplayProps {
  setlist: SetlistEntry[];
  show: Show;
  showCoachNotes: boolean;
  showDates?: ShowDate[]; 
  navigateToVenue?: () => void;
  showId?: string;
  openChangesModal?: boolean;
  setOpenChangesModal?: (open: boolean) => void;
}

const cleanSongName = (songName: string): string => {
  return songName
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/ñ/g, 'n')
    .replace(/ü/g, 'u')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/∆/g, 'a');
};

const getGridClass = (showCanonId: number | null): string => {
  return showCanonId !== null 
    ? "grid grid-cols-[32px_minmax(200px,1fr)_50px_60px_55px_50px_30px] gap-4"
    : "grid grid-cols-[32px_minmax(200px,1fr)_50px_30px] gap-4";
};

const createMarkup = (htmlContent: string) => {
  return { __html: htmlContent };
};

const calculateRarity = (timesPlayed: number | null, showsSinceDebut: number | null): string => {
  if (!timesPlayed || !showsSinceDebut || showsSinceDebut === 0) return '';
  const percentage = (timesPlayed / showsSinceDebut) * 100;
  return Math.round(percentage) + '%';
};

const getRarityColor = (percentage: string | null): string => {
  // If percentage is null or not a valid percentage string, return transparent
  if (!percentage || percentage === '-' || percentage === '') return 'transparent';
  
  // Convert percentage string to number
  const numericPercentage = parseFloat(percentage.replace('%', ''));
  
  if (isNaN(numericPercentage)) return 'transparent';
  
  // Define our 4 color stops with breakpoints at 0, 15, 50, 100
  const colorStops = [
    { percent: 0, color: { r: 156, g: 12, b: 12 } },     // #9C0C0C (Even Darker Red)
    { percent: 12, color: { r: 230, g: 81, b: 0 } },     // #E65100 (Darker Orange)
    { percent: 24, color: { r: 179, g: 135, b: 0 } },    // #D3A304 (Dark Yellow)
    { percent: 50, color: { r: 46, g: 125, b: 50 } },    // #2E7D32 (Darker Green)
    { percent: 100, color: { r: 13, g: 71, b: 161 } }    // #0D47A1 (Darker Blue)
  ];
  
  // Find the color stops to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (numericPercentage >= colorStops[i].percent && numericPercentage <= colorStops[i + 1].percent) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const range = upperStop.percent - lowerStop.percent;
  const factor = range !== 0 ? (numericPercentage - lowerStop.percent) / range : 0;
  
  // Interpolate RGB values
  const r = Math.round(lowerStop.color.r + factor * (upperStop.color.r - lowerStop.color.r));
  const g = Math.round(lowerStop.color.g + factor * (upperStop.color.g - lowerStop.color.g));
  const b = Math.round(lowerStop.color.b + factor * (upperStop.color.b - lowerStop.color.b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

export default function FullSetlistDisplay({ 
  setlist, 
  show, 
  showCoachNotes, 
  showDates = [], 
  navigateToVenue, 
  showId,
  openChangesModal,
  setOpenChangesModal
}: FullSetlistDisplayProps) {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [hoveredPersonnel, setHoveredPersonnel] = useState<string | null>(null);
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);
  const [showPosition, setShowPosition] = useState<{ 
    current: number; 
    total: number;
    prevShowId: string | null;
    nextShowId: string | null;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [individualToggles, setIndividualToggles] = useState<{[key: string]: boolean}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [copiedEntries, setCopiedEntries] = useState<Set<string>>(new Set());
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(roleData?.is_admin || false);
      }
    };
    
    checkAdminStatus();
  }, []);

  // Add useEffect to reset individual toggles when global toggle changes
  useEffect(() => {
    setIndividualToggles({});
  }, [showCoachNotes]);

  // Add a function to handle individual whistle clicks
  const toggleIndividualCoachNote = (entryId: string) => {
    setIndividualToggles(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  // Update the logic to determine if coach notes should be shown for an entry
  const shouldShowCoachNotesForEntry = (entryId: string, hasCoachNotes: boolean) => {
    if (!hasCoachNotes) return false;
    
    // If this entry has an individual toggle state, use that
    if (entryId in individualToggles) {
      return individualToggles[entryId];
    }
    
    // Otherwise fall back to the global toggle
    return showCoachNotes;
  };

  useEffect(() => {
    const fetchAttendeeCount = async () => {
      if (!showId) return;
      
      const { count, error } = await supabase
        .from('user_attended_shows')
        .select('*', { count: 'exact', head: true })
        .eq('show_id', show.show_id);
      
      if (error) {
        console.error('Error fetching attendee count:', error);
        return;
      }
      
      setAttendeeCount(count || 0);
    };
    
    fetchAttendeeCount();
  }, [show.show_id, showId]);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {}, [show, setlist]);

  // Update the dependency array to include show.show_tour
  useEffect(() => {
    if (!show || !showDates.length) return; // Remove show.show_canonid check
    
    // Clear previous show position state when show changes
    setShowPosition(null);
    
    // First sort by date, then by canonid (to ensure proper ordering)
    const sortedShows = [...showDates].sort((a, b) => {
      // First compare dates
      const dateA = new Date(a.show_date);
      const dateB = new Date(b.show_date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If dates are the same, sort by canonid
      if (a.show_canonid === null) return 1;
      if (b.show_canonid === null) return -1;
      return a.show_canonid - b.show_canonid;
    });
    
    // Include all shows, regardless of canonid
    // Find current show position
    const currentIndex = sortedShows.findIndex(s => s.show_id === show.show_id);
    const currentPosition = currentIndex + 1;
    
    // Determine previous and next show IDs
    const prevShowId = currentIndex > 0 ? sortedShows[currentIndex - 1].show_id : null;
    const nextShowId = currentIndex < sortedShows.length - 1 ? sortedShows[currentIndex + 1].show_id : null;
    
    setShowPosition({
      current: currentPosition,
      total: sortedShows.length,
      prevShowId,
      nextShowId
    });
  }, [show, showDates, show?.show_id, show?.show_tour]); // Keep the same dependency array

  useEffect(() => {
    const groupsArray: GuestGroup[] = [];
    const seenGuestKeys = new Set<string>();
    
    setlist.forEach(entry => {
      if (!entry.guests || entry.guests.length === 0) return;
      
      const sortedGuests = [...entry.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
      const guestKey = sortedGuests.map(g => g.guest_canonid).join(',');
      
      if (!seenGuestKeys.has(guestKey)) {
        seenGuestKeys.add(guestKey);
        
        const colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#FF6B81', '#F1C40F', '#34495E', '#FFFFFF'];
        const existingColors = groupsArray.map(g => g.color);
        const availableColors = colors.filter(color => !existingColors.includes(color));
        const color = availableColors[0] || colors[groupsArray.length % colors.length];
        
        groupsArray.push({
          color,
          guests: sortedGuests
        });
      }
    });
    
    setGuestGroups(groupsArray);
  }, [setlist]);

  // Define the entry_short values we want to skip numbering for
  const skipNumberingShorts = ["fake", "tease", "reprise", "aborted"];

  // Instead of tracking seen songs with a simple Set, we'll track songs with valid numbers
  const songsWithNumbers = new Set<string>();
  let currentRunningNumber = 1;
  
  const getPlacementColor = (placement: string): string => {
    const colorMap: { [key: string]: string } = {
      'Set 1 Opener': '#047857',
      'Set 1 Closer': '#1e40af',
      'Set 2 Opener': '#10b981',
      'Set 3 Opener': '#10b981',
      'Set 4 Opener': '#10b981',
      'Set 5 Opener': '#10b981',
      'Set 2 Closer': '#3b82f6',
      'Set 3 Closer': '#3b82f6',
      'Set 4 Closer': '#3b82f6',
      'Set 5 Closer': '#3b82f6',
      'Encore 1': '#be123c',
      'Encore 2': '#f43f5e',
      'Encore 3': '#f43f5e'
    };
    
    if (placement.startsWith('Main Set')) {
      return 'transparent';
    }
    
    return colorMap[placement] || '#0c1d27';
  };

  const formatLength = (length: string | null): string => {
    if (!length) return '';
    const parts = length.split(':').map(part => parseInt(part));
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      if (hours === 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return length;
  };

  const isMainSet = (set: string): boolean => {
    return ['1', '2', '3', '4', '5'].includes(set);
  };
  
  const shouldShowSetBreak = (currentSet: string, nextSet: string): boolean => {
    return isMainSet(currentSet) && isMainSet(nextSet) && currentSet !== nextSet;
  };
  
  const getEncoreLabel = (set: string): string => {
    switch (set) {
      case 'E1': return 'Encore';
      case 'E2': return '2nd Encore';
      case 'E3': return '3rd Encore';
      default: return '';
    }
  };

  const getGuestColor = (entry: SetlistEntry): string => {
    if (!entry.guests || entry.guests.length === 0) return 'transparent';
    
    const sortedGuests = [...entry.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
    const entryGuestKey = sortedGuests
      .map(g => g.guest_canonid)
      .join(',');
    
    const group = guestGroups.find(group => 
      group.guests
        .sort((a, b) => a.guest_canonid - b.guest_canonid)
        .map(g => g.guest_canonid)
        .join(',') === entryGuestKey
    );
  
    return group?.color || 'transparent';
  };

  const uniquePlacements = new Set(setlist.map(entry => entry.entry_placement));
  const hasSinglePlacementType = uniquePlacements.size === 1;

  const handleNumberClick = async (entryId: string) => {
    if (!isAdmin) return;
    
    try {
      await navigator.clipboard.writeText(entryId);
      setCopiedEntries(prev => new Set(prev).add(entryId));
      
      // Remove from copied set after 2 seconds
      setTimeout(() => {
        setCopiedEntries(prev => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full space-y-0">
      {/* Mobile view content */}
      <div className="lg:hidden space-y-4">
        <ShowInfoContent 
          show={show} 
          navigateToVenue={navigateToVenue} 
          showPosition={showPosition}
          attendeeCount={attendeeCount}
          onAttendeeCountChange={setAttendeeCount}
          setlist={setlist}
        />
        {show.show_coachnotes && (
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth">Show Notes</h2>
              <Pen className="text-fifth w-[1rem] h-[1rem]" />
            </div>
            <div 
              className="text-fifth font-light text-xs hover:[&_a]:underline [&_a]:font-medium"
              dangerouslySetInnerHTML={{ __html: show.show_coachnotes }}
            />
          </div>
        )}
        {setlist.length > 0 && (
          <div className="space-y-4">
            <ShowStats setlist={setlist} show_canonid={show.show_canonid} />
          </div>
        )}
      </div>

      {/* Desktop layout */}
      <div className="space-y-6">
        {/* Main content area */}
        <div className={`flex flex-col lg:flex-row lg:gap-4 ${setlist.length === 0 ? 'lg:block' : ''}`}>
          {/* Main setlist content */}
          <div className={`flex-1 space-y-4 min-w-0 lg:mt-0 ${setlist.length === 0 ? 'lg:hidden' : ''}`}>
            {/* Setlist table */}
            {setlist.length > 0 && (
              <div className="bg-primary border border-secondary rounded-lg p-3 overflow-x-auto">
                <div className="min-w-[602px] divide-y divide-[#d8d7d7] relative">
                  <div className={`${getGridClass(show.show_canonid)} text-fifth text-sm pr-2 py-1 bg-fourth/40 font-medium`}>
                    <div className="w-8 text-center">#</div>
                    <div>Song</div>
                    <div className="text-center">Time</div>
                    {show.show_canonid !== null && (
                      <>
                        <div className="text-center">Last</div>
                        <div className="text-center">Tour</div>
                        <div className="text-center">Rarity</div>
                      </>
                    )}
                    <div className="flex justify-end">
                      <User strokeWidth={2} className="text-fifth w-5 h-5" />
                    </div>
                  </div>

                  {setlist.map((entry, index) => {
                    // Check if this entry has a short value that should skip numbering
                    const shouldSkipNumbering = entry.entry_short && 
                      skipNumberingShorts.includes(entry.entry_short.toLowerCase());
                    
                    // Has this song already received a number?
                    const alreadyHasNumber = songsWithNumbers.has(entry.entry_song);
                    
                    // Only assign a number if:
                    // 1. The song doesn't already have a number elsewhere in the setlist AND
                    // 2. This specific entry doesn't have a short value we want to skip
                    const displayNumber = (!alreadyHasNumber && !shouldSkipNumbering) ? 
                      currentRunningNumber++ : null;
                    
                    // If we assigned a number, add this song to our tracking set
                    if (displayNumber !== null) {
                      songsWithNumbers.add(entry.entry_song);
                    }
                    
                    const nextEntry = index < setlist.length - 1 ? setlist[index + 1] : null;
                    const prevEntry = index > 0 ? setlist[index - 1] : null;
                  
                    const elements = [];
                  
                    // Only show set breaks and encore dividers if we have multiple placement types
                    if (!hasSinglePlacementType) {
                      // Add encore divider if needed
                      if (prevEntry && entry.entry_set.startsWith('E')) {
                        // Only show encore divider when transitioning from non-encore or different encore
                        if (!prevEntry.entry_set.startsWith('E') || prevEntry.entry_set !== entry.entry_set) {
                          elements.push(
                            <div 
                              key={`encore-${entry.entry_id}`} 
                              className="text-fifth text-xs px-4 bg-red-800/30 font-medium text-center border-b border-secondary"
                            >
                              {getEncoreLabel(entry.entry_set)}
                            </div>
                          );
                        }
                      }
                  
                      // Add set break if needed
                      if (prevEntry && shouldShowSetBreak(prevEntry.entry_set, entry.entry_set)) {
                        elements.push(
                          <div 
                            key={`setbreak-${entry.entry_id}`} 
                            className="text-fifth text-xs px-4 bg-gray-300 font-medium text-center border-b border-secondary"
                          >
                            Set Break
                          </div>
                        );
                      }
                    }
                  
                    // Add the song entry
                    elements.push(
                      <div 
                        key={entry.entry_id}
                        className={`${getGridClass(show.show_canonid)} grid-auto-columns-min-content text-fifth text-sm hover:bg-tertiary/40 transition-colors pr-2 py-[1px] items-start bg-primary relative`}
                      >
                        {/* Number column */}
                        <div
                          className={`w-8 ${getPlacementColor(entry.entry_placement) !== 'transparent' ? 'text-white' : 'text-fifth'} text-center font-medium leading-[1.125rem] rounded-full mt-[1px] ${isAdmin ? 'cursor-pointer' : ''} relative`}
                          style={{
                            backgroundColor: copiedEntries.has(entry.entry_id) 
                              ? '#22c55e' 
                              : getPlacementColor(entry.entry_placement)
                          }}
                          onClick={() => handleNumberClick(entry.entry_id)}
                          onMouseEnter={(e) => {
                            if (!isMobile) {
                              setHoveredEntry(entry.entry_id);
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }
                          }}
                          onMouseMove={(e) => {
                            if (!isMobile) {
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }
                          }}
                          onMouseLeave={() => {
                            if (!isMobile) {
                              setHoveredEntry(null);
                            }
                          }}
                        >
                            {copiedEntries.has(entry.entry_id) 
                              ? '✓' 
                              : (displayNumber || '\u00A0')
                            }
                          {!isMobile && hoveredEntry === entry.entry_id && !copiedEntries.has(entry.entry_id) && (
                            <div className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {entry.entry_placement}
                            </div>
                          )}
                        </div>
                    
                        {/* Song title and notes column */}
                        <div className="cursor-pointer w-full flex justify-between items-start">
                          <div
                            className="flex-grow"
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                setHoveredSong(entry.entry_id);
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseMove={(e) => {
                              if (!isMobile) {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseLeave={() => {
                              if (!isMobile) {
                                setHoveredSong(null);
                              }
                            }}
                          >
                            <div className="w-full break-words flex items-center gap-2">
                              <div className="flex-grow">
                                <strong>
                                  <span 
                                    className="text-fifth mr-2 hover:underline font-trad text-lg text-[1.125rem] leading-[1rem] transition-colors cursor-pointer"
                                    onClick={() => {
                                      setModalSongData({
                                        isOpen: true,
                                        songName: entry.entry_song
                                      });
                                    }}
                                  >
                                    {cleanSongName(entry.entry_song)}
                                  </span>
                                  {entry.entry_short && (
                                    <span className="text-red-600 mr-2 text-[0.75rem] leading-[1.25rem] font-medium">[{entry.entry_short}]</span>
                                  )}
                                  {entry.entry_segue && (
                                    <MoveRight className="text-red-600 inline w-[1rem] h-[1rem]" />
                                  )}
                                </strong>
                              </div>
                              
                              {/* Whistle and JOTY badge container */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {entry.entry_coachnotes && (
                                  <div className="relative">
                                    <GiWhistle 
                                      className={`h-5 w-5 cursor-pointer ${shouldShowCoachNotesForEntry(entry.entry_id, true) ? 'text-fourth' : 'text-fifth'} hover:text-fifth/60 transition-colors`} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleIndividualCoachNote(entry.entry_id);
                                      }}
                                      onMouseEnter={(e) => {
                                        e.stopPropagation(); // Add this
                                        if (!isMobile) {
                                          setHoveredEntry(entry.entry_id + '_whistle');
                                          setHoveredSong(null); // Add this to clear any song hover
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseMove={(e) => {
                                        e.stopPropagation(); // Add this
                                        if (!isMobile) {
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.stopPropagation(); // Add this
                                        if (!isMobile) {
                                          setHoveredEntry(null);
                                        }
                                      }}
                                    />
                                    {!isMobile && hoveredEntry === entry.entry_id + '_whistle' && (
                                      <div 
                                        className="fixed text-xs bg-tertiary font-normal text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] text-left max-w-[250px] whitespace-normal break-words [&_a]:text-[#a9682e] [&_a]:font-semibold"
                                        style={{
                                          left: `${mousePosition.x + 10}px`,
                                          top: `${mousePosition.y - 10}px`
                                        }}
                                        dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }}
                                      />
                                    )}
                                  </div>
                                )}
                                {entry.joty_round && (
                                  <JOTYBadge 
                                    round={entry.joty_round} 
                                    compact={true}
                                    onClick={() => {
                                      // Extract year from the show date
                                      const year = new Date(show.show_date).getFullYear();
                                      navigate(`/joty/${year}`);
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                            
                            {entry.entry_coachnotes && shouldShowCoachNotesForEntry(entry.entry_id, true) && (
                              <div 
                                className="text-fifth/80 text-xs mt-0.5 w-full break-words [&_a]:text-[#a9682e] [&_a]:font-medium font-light"
                                dangerouslySetInnerHTML={{ __html: entry.entry_coachnotes }}
                              />
                            )}
                            
                            {/* Hover tooltip remains the same */}
                            {!isMobile && hoveredSong === entry.entry_id && (
                              <div 
                                className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
                                style={{
                                  left: `${mousePosition.x + 10}px`,
                                  top: `${mousePosition.y - 10}px`
                                }}
                              >
                                <div className="font-medium">
                                  <span>{entry.entry_song}</span>
                                  {entry.entry_short && (
                                    <span className="text-red-600 ml-2">[{entry.entry_short}]</span>
                                  )}
                                  {entry.entry_segue && (
                                    <MoveRight className="text-red-600 inline ml-2 w-[1rem] h-[1rem]" />
                                  )}
                                </div>
                                {entry.times_played && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.times_played)} />
                                  </div>
                                )}
                                {entry.shows_since_debut && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.shows_since_debut)} />
                                  </div>
                                )}
                                {entry.song_rarity_percentage && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.song_rarity_percentage)} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                    
                        {/* Duration column */}
                        <div className="text-fifth/80 text-center font-light">
                          {formatLength(entry.entry_length)}
                        </div>

                        {/* Last played column */}
                        {show.show_canonid !== null && (
                          <div className={`text-fifth/80 text-center rounded-md ${
                              entry.last_count?.includes('TD') 
                                ? 'bg-[#55c26d]/80 text-fifth' 
                                : entry.last_count?.includes('Debut')
                                  ? 'bg-[#ec7171]/80 text-fifth'
                                  : ''
                            } ${entry.last_show_id ? 'cursor-pointer hover:underline transition-colors' : ''}`}
                            onClick={() => {
                              if (entry.last_show_id) {
                                navigate(`/setlist/${entry.last_show_id}`);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile && entry.last_show_id) {
                                setHoveredEntry(entry.entry_id + '_last');
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseMove={(e) => {
                              if (!isMobile) {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseLeave={() => {
                              if (!isMobile) {
                                setHoveredEntry(null);
                              }
                            }}
                          >
                            <span className="font-medium">{entry.last_count || ''}</span>
                            {!isMobile && hoveredEntry === entry.entry_id + '_last' && entry.last_show_id && (
                              <div 
                                className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                                style={{
                                  left: `${mousePosition.x + 10}px`,
                                  top: `${mousePosition.y - 10}px`
                                }}
                              >
                                <div className="font-medium">{entry.last_show_date}</div>
                                <div className="font-light">{entry.last_venue_location}</div>
                                {entry.last_show_tour && (
                                  <div className="font-light">{entry.last_show_tour}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    
                        {/* Tour count column */}
                        {show.show_canonid !== null && (
                          <div className="text-fifth/80 font-light text-center">
                            {entry.song_tour_count || ''}
                          </div>
                        )}
                        
                        {/* Rarity column */}
                        {show.show_canonid !== null && (
                          <div 
                            className="text-white text-center font-normal rounded-md px-1 cursor-pointer"
                            style={{ 
                              backgroundColor: getRarityColor(calculateRarity(entry.times_played_num, entry.shows_since_debut_num)) 
                            }}
                            onMouseEnter={(e) => {
                              if (!isMobile) {
                                setHoveredSong(entry.entry_id + '_rarity');
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseMove={(e) => {
                              if (!isMobile) {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseLeave={() => {
                              if (!isMobile) {
                                setHoveredSong(null);
                              }
                            }}
                          >
                            {calculateRarity(entry.times_played_num, entry.shows_since_debut_num)}
                            
                            {/* Add the same tooltip here */}
                            {!isMobile && hoveredSong === entry.entry_id + '_rarity' && (
                              <div 
                                className="fixed text-xs bg-tertiary text-fifth px-3 py-1 rounded border font-light border-secondary shadow-lg min-w-max z-[9999] text-left"
                                style={{
                                  left: `${mousePosition.x + 10}px`,
                                  top: `${mousePosition.y - 10}px`
                                }}
                              >
                                <div className="font-medium">
                                  <span>{entry.entry_song}</span>
                                  {entry.entry_short && (
                                    <span className="text-red-600 ml-2">[{entry.entry_short}]</span>
                                  )}
                                  {entry.entry_segue && (
                                    <MoveRight className="text-red-600 inline ml-2 w-[1rem] h-[1rem]" />
                                  )}
                                </div>
                                {entry.times_played && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.times_played)} />
                                  </div>
                                )}
                                {entry.shows_since_debut && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.shows_since_debut)} />
                                  </div>
                                )}
                                {entry.song_rarity_percentage && (
                                  <div>
                                    <span dangerouslySetInnerHTML={createMarkup(entry.song_rarity_percentage)} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Personnel column */}
                        <div 
                          className="cursor-pointer relative"
                          onMouseEnter={(e) => {
                            if (!isMobile) {
                              setHoveredPersonnel(entry.entry_id);
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }
                          }}
                          onMouseMove={(e) => {
                            if (!isMobile) {
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }
                          }}
                          onMouseLeave={() => {
                            if (!isMobile) {
                              setHoveredPersonnel(null);
                            }
                          }}
                        >
                          <div 
                            className="w-5 h-5 rounded ml-auto"
                            style={{ backgroundColor: getGuestColor(entry) }}
                          />
                          {!isMobile && hoveredPersonnel === entry.entry_id && (
                            <div 
                              className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] max-w-[300px] whitespace-normal break-words"
                              style={{
                                right: `${window.innerWidth - mousePosition.x + 5}px`,
                                top: `${mousePosition.y - 10}px`
                              }}
                            >
                              {entry.guests
                                ?.sort((a, b) => a.guest_canonid - b.guest_canonid)
                                .map(guest => guest.guest_display_name)
                                .join(', ') || 'No guest information'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                    
                    return elements;
                  })}
                </div>
              </div>
            )}

            {/* Callbacks container */}
            {setlist.length > 0 && show.show_callbacks && (
              <div className="bg-primary border border-secondary rounded-lg p-3 text-sm">
                <div 
                  className="font-light text-fifth [&_a]:text-fifth [&_a]:border [&_a]:border-secondary [&_a]:bg-tertiary [&_a]:rounded-lg [&_a]:py-0.5 [&_a]:px-1 [&_a]:font-medium"
                  dangerouslySetInnerHTML={{ __html: show.show_callbacks }}
                />
              </div>
            )}
            
            {/* Stats and Guest Legend section */}
            {setlist.length > 0 && (
              <div className="space-y-4">
                {/* Desktop layout with grid */}
                <div className="hidden md:grid grid-cols-2 gap-4 items-start">
                  <SongSpread setlist={setlist} />
                  
                  <div className="space-y-4">
                    {guestGroups.length > 0 && (
                      <div className="bg-primary border border-secondary rounded-lg p-3 h-fit relative">
                        <User className="w-5 h-5 text-fifth absolute top-3 right-3" />
                        <div className="grid grid-cols-[20px_1fr] gap-x-4 gap-y-1 pr-8">
                          {guestGroups.map((group, index) => (
                          <React.Fragment key={index}>
                            <div 
                              className="w-5 h-5 rounded"
                              style={{ backgroundColor: group.color }}
                            />
                            <div className="text-fifth text-sm flex items-center flex-wrap">
                              {group.guests
                                .sort((a, b) => a.guest_canonid - b.guest_canonid)
                                .map((g, gIndex) => (
                                  <React.Fragment key={g.guest_id}>
                                    <span className="inline-block whitespace-nowrap">
                                      <span 
                                        className="cursor-pointer hover:underline transition-colors font-medium relative"
                                        onClick={() => navigate(`/personnel/${g.guest_id}`)}
                                      onMouseEnter={(e) => {
                                        if (!isMobile) {
                                          setHoveredPersonnel(g.guest_id);
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseMove={(e) => {
                                        if (!isMobile) {
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        if (!isMobile) {
                                          setHoveredPersonnel(null);
                                        }
                                      }}
                                    >
                                      {g.guest_display_name}
                                      {!isMobile && hoveredPersonnel === g.guest_id && (
                                        <div 
                                          className="fixed text-xs font-medium bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] whitespace-nowrap"
                                          style={{
                                            left: `${mousePosition.x + 10}px`,
                                            top: `${mousePosition.y - 10}px`
                                          }}
                                        >
                                          {g.guest_instrument}
                                        </div>
                                      )}
                                    </span>
                                    {gIndex < group.guests.length - 1 && <span>,&nbsp;</span>}
                                  </span>
                                </React.Fragment>
                              ))}
                          </div>
                          </React.Fragment>
                        ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Changes component - now inside the right column */}
                    {showId && <ShowChanges 
                      showId={showId} 
                      openModal={openChangesModal} 
                      setOpenModal={setOpenChangesModal} 
                    />}
                    
                    {/* Add ReleaseContainer here for medium+ screens */}
                    {showId && (
                      <div className="lg:hidden [&_img]:object-contain">
                        <ReleaseContainer showId={showId} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile layout - stacked */}
                <div className="md:hidden space-y-4">
                  <SongSpread setlist={setlist} />
                  
                  {/* Changes component */}
                  {showId && <ShowChanges showId={showId} />}
                  
                  {guestGroups.length > 0 && (
                    <div className="bg-primary border border-secondary rounded-lg p-3 h-fit relative">
                      <User className="w-5 h-5 text-fifth absolute top-3 right-3" />
                      <div className="grid grid-cols-[20px_1fr] gap-x-4 gap-y-2 pr-8">
                        {guestGroups.map((group, index) => (
                          <React.Fragment key={index}>
                            <div 
                              className="w-5 h-5 rounded"
                              style={{ backgroundColor: group.color }}
                            />
                            <div className="text-fifth text-sm flex items-center flex-wrap">
                              {group.guests
                                .sort((a, b) => a.guest_canonid - b.guest_canonid)
                                .map((g, gIndex) => (
                                  <React.Fragment key={g.guest_id}>
                                    <span className="inline-block whitespace-nowrap">
                                      <span 
                                        className="cursor-pointer hover:underline transition-colors font-medium relative"
                                        onClick={() => navigate(`/guest/${g.guest_id}`)}
                                      onMouseEnter={(e) => {
                                        if (!isMobile) {
                                          setHoveredPersonnel(g.guest_id);
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseMove={(e) => {
                                        if (!isMobile) {
                                          setMousePosition({ x: e.clientX, y: e.clientY });
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        if (!isMobile) {
                                          setHoveredPersonnel(null);
                                        }
                                      }}
                                    >
                                      {g.guest_display_name}
                                      {!isMobile && hoveredPersonnel === g.guest_id && (
                                        <div 
                                          className="fixed text-xs font-semibold bg-secondary text-fifth px-3 py-1 rounded border border-secondary shadow-lg z-[9999] whitespace-nowrap"
                                          style={{
                                            left: `${mousePosition.x + 10}px`,
                                            top: `${mousePosition.y - 10}px`
                                          }}
                                        >
                                          {g.guest_instrument}
                                        </div>
                                      )}
                                    </span>
                                    {gIndex < group.guests.length - 1 && <span>,&nbsp;</span>}
                                  </span>
                                </React.Fragment>
                              ))}
                          </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ReleaseContainer for mobile only */}
                  {showId && (
                    <div className="[&_img]:object-contain">
                      <ReleaseContainer showId={showId} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - only visible on desktop */}
          <div className={`hidden lg:block ${setlist.length === 0 ? 'w-full' : 'w-[270px] shrink-0'} space-y-4`}>
            <ShowInfoContent 
              show={show} 
              navigateToVenue={navigateToVenue} 
              showPosition={showPosition}
              attendeeCount={attendeeCount}
              onAttendeeCountChange={setAttendeeCount}
              setlist={setlist}
            />
            {show.show_coachnotes && (
              <div className="bg-primary border border-secondary rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth font-medium text-fifth">Show Notes</h2>
                  <Pen className="text-fifth w-[1rem] h-[1rem]" />
                </div>
                <div 
                  className="text-fifth font-light text-xs hover:[&_a]:underline [&_a]:font-medium"
                  dangerouslySetInnerHTML={{ __html: show.show_coachnotes }}
                />
              </div>
            )}
            {setlist.length > 0 && (
              <div>
                <ShowStats setlist={setlist} show_canonid={show.show_canonid} />
              </div>
            )}
            {showId && <ReleaseContainer showId={showId} />}
          </div>
        </div>
      </div>
      
      {/* Song Tour Performances Modal */}
      <SongTourPerformancesModal
        isOpen={modalSongData.isOpen}
        onClose={() => setModalSongData({ isOpen: false, songName: '' })}
        songName={modalSongData.songName}
        tourId={show.tour_id || ''}
        currentShowId={show.show_id}
      />
    </div>
  );
}