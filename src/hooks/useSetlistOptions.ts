import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SetOptions, SetnumOptions, SegueOptions, PlacementOptions, SongOptions, ShortOptions, GuestCategory } from '../types/setlist';

export const useSetlistOptions = () => {
  const [sets, setSets] = useState<SetOptions[]>([]);
  const [setnums, setSetnums] = useState<SetnumOptions[]>([]);
  const [segues, setSegues] = useState<SegueOptions[]>([]);
  const [placements, setPlacements] = useState<PlacementOptions[]>([]);
  const [songs, setSongs] = useState<SongOptions[]>([]);
  const [shorts, setShorts] = useState<ShortOptions[]>([]);
  const [allGuests, setAllGuests] = useState<GuestCategory[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch sets
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('set')
          .order('set');
        
        if (setsError) throw setsError;
        setSets(setsData || []);

        // Fetch setnums
        const { data: setnumsData, error: setnumsError } = await supabase
          .from('setnums')
          .select('setnums')
          .order('setnums');
        
        if (setnumsError) throw setnumsError;
        setSetnums(setnumsData || []);

        // Fetch segues
        const { data: seguesData, error: seguesError } = await supabase
          .from('segues')
          .select('segues')
          .order('segues');
        
        if (seguesError) throw seguesError;
        setSegues(seguesData || []);

        // Fetch placements
        const { data: placementsData, error: placementsError } = await supabase
          .from('placements')
          .select('placements')
          .order('placement_order');
        
        if (placementsError) throw placementsError;
        setPlacements(placementsData || []);

        // Fetch all songs with pagination
        let allSongs: SongOptions[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
          const { data: songsData, error: songsError } = await supabase
            .from('songs')
            .select('song, song_id')
            .order('song')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (songsError) throw songsError;
          
          if (songsData && songsData.length > 0) {
            allSongs = [...allSongs, ...songsData];
            page++;
            hasMore = songsData.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        setSongs(allSongs);

        // Fetch song shorts
        const { data: shortsData, error: shortsError } = await supabase
          .from('song_shorts')
          .select('song_shorts')
          .order('song_shorts');
        
        if (shortsError) throw shortsError;
        setShorts(shortsData || []);
        
        // Fetch all guests
        const { data: guestsData, error: guestsError } = await supabase
          .from('guests')
          .select('guest_id, guest, guest_displayname, guest_category, guest_instrument')
          .order('guest_category')
          .order('guest_displayname');
          
        if (guestsError) throw guestsError;
        
        // Group guests by category
        const groupedGuests: GuestCategory[] = [];
        if (guestsData) {
          const guestsByCategory: Record<string, any[]> = {};
          
          guestsData.forEach(guest => {
            const category = guest.guest_category || 'Uncategorized';
            if (!guestsByCategory[category]) {
              guestsByCategory[category] = [];
            }
            guestsByCategory[category].push(guest);
          });
          
          // Convert to array of categories
          Object.keys(guestsByCategory).sort().forEach(category => {
            groupedGuests.push({
              category,
              guests: guestsByCategory[category]
            });
          });
        }
        
        setAllGuests(groupedGuests);
      } catch (error) {
        // Error handling without console logging
      }
    };

    fetchOptions();
  }, []);

  return {
    sets,
    setnums,
    segues,
    placements,
    songs,
    shorts,
    allGuests
  };
};
