import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SetlistEntry, GuestGroup, ShowPosition, Show, ShowDate } from '../types/setlist';
import { calculateShowPosition } from '../utils/setlistUtils';

export const useAdminStatus = () => {
  const [isAdmin, setIsAdmin] = useState(false);

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

  return isAdmin;
};

export const useAttendeeCount = (showId: string | undefined, show: Show | null) => {
  const [attendeeCount, setAttendeeCount] = useState(0);

  useEffect(() => {
    const fetchAttendeeCount = async () => {
      if (!showId || !show) return;
      
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
  }, [show?.show_id, showId]);

  return { attendeeCount, setAttendeeCount };
};

export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

export const useShowPosition = (show: Show | null, showDates: ShowDate[]) => {
  const [showPosition, setShowPosition] = useState<ShowPosition | null>(null);

  useEffect(() => {
    if (!show) {
      setShowPosition(null);
      return;
    }
    const position = calculateShowPosition(show, showDates);
    setShowPosition(position);
  }, [show, showDates, show?.show_id, show?.show_tour]);

  return showPosition;
};

export const useGuestGroups = (setlist: SetlistEntry[]) => {
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);

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

  return guestGroups;
};

export const useCoachNotesToggle = (showCoachNotes: boolean) => {
  const [individualToggles, setIndividualToggles] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setIndividualToggles({});
  }, [showCoachNotes]);

  const toggleIndividualCoachNote = (entryId: string) => {
    setIndividualToggles(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const shouldShowCoachNotesForEntry = (entryId: string, hasCoachNotes: boolean) => {
    if (!hasCoachNotes) return false;
    
    if (entryId in individualToggles) {
      return individualToggles[entryId];
    }
    
    return showCoachNotes;
  };

  return { toggleIndividualCoachNote, shouldShowCoachNotesForEntry };
};

export const useScrollToReleases = (scrollToReleases: boolean) => {
  const [shouldHighlightReleases, setShouldHighlightReleases] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (scrollToReleases) {
      // Set highlight flag
      setShouldHighlightReleases(true);
      
      // Scroll to releases section after a delay to ensure component is rendered
      const scrollTimer = setTimeout(() => {
        const releaseContainer = document.querySelector('[data-release-container]');
        if (releaseContainer) {
          releaseContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500); // Increased delay to ensure component is fully rendered
      
      // Clear the highlight after 2 seconds
      const highlightTimer = setTimeout(() => {
        setShouldHighlightReleases(false);
      }, 2000);
      
      // Clear the navigation state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
      
      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [scrollToReleases, navigate, location.pathname]);

  return shouldHighlightReleases;
};

export const useHoverStates = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredEntry, setHoveredEntry] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [hoveredPersonnel, setHoveredPersonnel] = useState<string | null>(null);

  return {
    mousePosition,
    setMousePosition,
    hoveredEntry,
    setHoveredEntry,
    hoveredSong,
    setHoveredSong,
    hoveredPersonnel,
    setHoveredPersonnel
  };
};

export const useModalState = () => {
  const [modalSongData, setModalSongData] = useState<{
    isOpen: boolean;
    songName: string;
  }>({
    isOpen: false,
    songName: ''
  });

  return { modalSongData, setModalSongData };
};

export const useCopiedEntries = () => {
  const [copiedEntries, setCopiedEntries] = useState<Set<string>>(new Set());

  const handleNumberClick = async (entryId: string, isAdmin: boolean) => {
    if (!isAdmin) return;
    
    try {
      await navigator.clipboard.writeText(entryId);
      setCopiedEntries(prev => new Set(prev).add(entryId));
      
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

  return { copiedEntries, handleNumberClick };
};
