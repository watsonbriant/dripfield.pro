import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Guest {
  guest_display_name: string;
  guest_id: string;
  guest_canonid: number;
  guest_instrument: string;
}

interface GuestGroup {
  color: string;
  guests: Guest[];
}

interface SongPerformance {
  show_date: string;
  show_id: string;
  entry_placement: string;
  show_tour: string | null;
  show_subvenue: string;
  show_venue_location: string;
  show_subvenue_venue?: string;
  venue_id?: string;
  entry_length: string | null;
  entry_short: string | null;
  entry_coachnotes: string | null;
  entry_set: string;
  entry_setnum: string;
  entry_song?: string;
  entry_segue?: string | null;
  guests?: Guest[];
}

export const useSongPerformances = (isOpen: boolean, songName: string, tourId: string) => {
  const [performances, setPerformances] = useState<SongPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [tourName, setTourName] = useState<string>('');
  const [songId, setSongId] = useState<string>('');
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);

  useEffect(() => {
    if (isOpen && songName && tourId) {
      fetchPerformances();
    }
  }, [isOpen, songName, tourId]);

  const fetchPerformances = async () => {
    setLoading(true);
    try {
      // First, fetch the tour name
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('tour')
        .eq('tour_id', tourId)
        .single();
  
      if (tourError) throw tourError;
      if (tourData) {
        setTourName(tourData.tour);
      }

      // Fetch the song_id
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('song_id')
        .eq('song', songName)
        .single();

      if (songError) throw songError;
      if (songData) {
        setSongId(songData.song_id);
      }
  
      const { data, error } = await supabase
        .from('setlist_entries')
        .select(`
            entry_id,
            entry_set,
            entry_setnum,
            entry_song,
            entry_short,
            entry_segue,
            entry_length,
            entry_placement,
            entry_coachnotes,
            setlist_entry_guests (
            guest_id,
            guests (
                guest_id,
                guest_canonid,
                guest_displayname,
                guest_instrument
            )
            ),
            shows!inner (
            show_id,
            show_date,
            show_tour,
            show_subvenue,
            show_venue_location,
            tours!inner (
                tour_id
            ),
            subvenues (
                subvenue_venue,
                venues (
                venue_id
                )
            )
            )
        `)
        .eq('entry_song', songName)
        .eq('shows.tours.tour_id', tourId)
        .order('show_date', { foreignTable: 'shows', ascending: true });

      if (error) throw error;

      const processedData = data?.map(entry => ({
        show_date: entry.shows.show_date,
        show_id: entry.shows.show_id,
        entry_placement: entry.entry_placement,
        show_tour: entry.shows.show_tour,
        show_subvenue: entry.shows.show_subvenue,
        show_venue_location: entry.shows.show_venue_location,
        show_subvenue_venue: entry.shows.subvenues?.subvenue_venue,
        venue_id: entry.shows.subvenues?.venues?.venue_id,
        entry_length: entry.entry_length,
        entry_short: entry.entry_short,
        entry_coachnotes: entry.entry_coachnotes,
        entry_set: entry.entry_set,
        entry_setnum: entry.entry_setnum,
        entry_song: entry.entry_song,
        entry_segue: entry.entry_segue,
        guests: entry.setlist_entry_guests?.map((seg: any) => seg.guests).filter(Boolean) || []
      })) || [];

      // Sort by show_date, then by entry_set, then by entry_setnum
      processedData.sort((a, b) => {
        // First sort by show_date
        const dateComparison = new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        // If dates are equal, sort by entry_set
        const setA = a.entry_set || '';
        const setB = b.entry_set || '';
        const setComparison = setA.localeCompare(setB);
        if (setComparison !== 0) return setComparison;
        
        // If sets are equal, sort by entry_setnum
        const setnumA = parseInt(a.entry_setnum) || 0;
        const setnumB = parseInt(b.entry_setnum) || 0;
        return setnumA - setnumB;
      });

      setPerformances(processedData);

      // Group guests by unique combinations
      const groupsByGuests = processedData.reduce((acc: { [key: string]: GuestGroup }, entry) => {
        if (!entry.guests || entry.guests.length === 0) return acc;
        
        const sortedGuests = [...entry.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
        
        const guestKey = sortedGuests
          .map(g => g.guest_canonid)
          .join(',');
        
        if (!acc[guestKey]) {
          const colors = ['#0bacc9', '#e4482f', '#fcb924', '#67a343', '#9e598f', '#be823a', '#f58ba2', '#7b6e66', '#ec7523', '#050608', '#fee4d3', '#5a2c08', '#8ecfbb'];
          const existingColors = Object.values(acc).map(g => g.color);
          const availableColors = colors.filter(color => !existingColors.includes(color));
          const color = availableColors[0] || colors[Object.keys(acc).length % colors.length];

          acc[guestKey] = {
            color,
            guests: sortedGuests
          };
        }
        return acc;
      }, {});

      setGuestGroups(Object.values(groupsByGuests));
    } catch (error) {
      console.error('Error fetching performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGuestColor = (perf: SongPerformance): string => {
    if (!perf.guests || perf.guests.length === 0) return 'transparent';
    
    const sortedGuests = [...perf.guests].sort((a, b) => a.guest_canonid - b.guest_canonid);
    const perfGuestKey = sortedGuests
      .map(g => g.guest_canonid)
      .join(',');
    
    const group = guestGroups.find(group => 
      group.guests
        .sort((a, b) => a.guest_canonid - b.guest_canonid)
        .map(g => g.guest_canonid)
        .join(',') === perfGuestKey
    );

    return group?.color || 'transparent';
  };

  return {
    performances,
    loading,
    tourName,
    songId,
    guestGroups,
    getGuestColor
  };
};
