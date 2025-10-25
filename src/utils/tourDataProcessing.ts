// Utility functions for processing tour data

import { SongEntryWithId, SlotData } from '../types/tourTypes';

export const processTourDataWithCategories = async (
  entries: Array<{ entry_placement: string; entry_song: string; entry_show?: string }>,
  showIds: string[]
): Promise<SlotData[]> => {
  const showOpeners: Record<string, number> = {};
  const setOpeners: Record<string, number> = {};
  const setClosers: Record<string, number> = {};
  const encores: Record<string, number> = {};

  const uniqueCombinations = new Set<string>();

  entries.forEach(entry => {
    const placement = entry.entry_placement || '';
    const show = entry.entry_show || '';
    const song = entry.entry_song;

    const uniqueKey = `${show}|${placement}|${song}`;

    if (!uniqueCombinations.has(uniqueKey)) {
      uniqueCombinations.add(uniqueKey);

      if (placement === "Set 1 Opener") {
        showOpeners[song] = (showOpeners[song] || 0) + 1;
      }

      if (placement.includes("Opener")) {
        setOpeners[song] = (setOpeners[song] || 0) + 1;
      }

      if (placement.includes("Closer")) {
        setClosers[song] = (setClosers[song] || 0) + 1;
      }

      if (placement.includes("Encore")) {
        encores[song] = (encores[song] || 0) + 1;
      }
    }
  });

  const hasShowOpeners = Object.keys(showOpeners).length > 0;
  const hasSetOpeners = Object.keys(setOpeners).length > 0;
  const hasSetClosers = Object.keys(setClosers).length > 0;
  const hasEncores = Object.keys(encores).length > 0;

  if (!hasShowOpeners && !hasSetOpeners && !hasSetClosers && !hasEncores) {
    return [];
  }

  // Fetch artwork data directly like LongestSongs does
  const { supabase } = await import('../lib/supabase');
  const uniqueSongs = [...new Set([
    ...Object.keys(showOpeners),
    ...Object.keys(setOpeners), 
    ...Object.keys(setClosers),
    ...Object.keys(encores)
  ])];

  const { data: songsData } = await supabase
    .from('songs')
    .select(`
      song,
      categories!inner(
        category_artwork
      )
    `)
    .in('song', uniqueSongs);

  const songArtworkMap: Record<string, string> = {};
  songsData?.forEach(song => {
    if (song.categories?.category_artwork) {
      songArtworkMap[song.song] = song.categories.category_artwork;
    }
  });

  const formatSlotData = (data: Record<string, number>, title: string): SlotData => {
    const sortedData = Object.entries(data)
      .map(([song, count]) => ({
        song,
        count,
        artwork: songArtworkMap[song] || undefined
      }))
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        return a.song.localeCompare(b.song);
      })
      .slice(0, 8)
      .map(({ song, count, artwork }) => ({ left: song, right: count, artwork }));

    if (sortedData.length === 0) {
      return {
        title,
        headerLeft: 'Song',
        headerRight: 'Count',
        data: []
      };
    }

    return {
      title,
      headerLeft: 'Song',
      headerRight: 'Count',
      data: sortedData
    };
  };

  const result = [];

  if (hasShowOpeners) {
    result.push(formatSlotData(showOpeners, 'Show Openers'));
  }

  if (hasSetOpeners) {
    result.push(formatSlotData(setOpeners, 'Set Openers'));
  }

  if (hasSetClosers) {
    result.push(formatSlotData(setClosers, 'Set Closers'));
  }

  if (hasEncores) {
    result.push(formatSlotData(encores, 'Encores'));
  }

  return result;
};

export const processShowData = (shows: any[], attendedShowIds: string[]) => {
  return shows.map(show => {
    let totalSeconds = 0;
    const hasLength = show.setlist_entries?.some((entry: any) => entry.entry_length !== null);

    if (hasLength) {
      show.setlist_entries?.forEach((entry: any) => {
        if (entry.entry_length) {
          const parts = entry.entry_length.split(':').map(Number);
          if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
          } else if (parts.length === 2) {
            const [minutes, seconds] = parts;
            totalSeconds += (minutes * 60) + seconds;
          }
        }
      });
    }

    let show_length = null;
    if (totalSeconds > 0) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      show_length = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Format rarity with % symbol if it exists
    const show_rarity = show.show_rarity !== null && show.show_rarity !== undefined
      ? `${show.show_rarity.toFixed(2)}%`
      : null;

    // Format gap as string with 2 decimal places if it exists
    const show_gap = show.show_gap !== null && show.show_gap !== undefined
      ? show.show_gap.toFixed(2)
      : null;

    // Extract venue_id from the nested relationship
    let venue_id = null;
    if (show.subvenues?.venues) {
      if (Array.isArray(show.subvenues.venues)) {
        venue_id = show.subvenues.venues[0]?.venue_id;
      } else {
        venue_id = show.subvenues.venues.venue_id;
      }
    }

    return {
      ...show,
      show_length,
      show_rarity,
      show_gap,
      venue_id,
      attended: attendedShowIds.includes(show.show_id)
    };
  });
};

export const processSlotsData = (shows: any[]) => {
  return shows.map(show => {
    const slots: any = {
      show_id: show.show_id,
      Show_Date: show.show_date
    };

    const placementEntries: { [key: string]: Array<SongEntryWithId> } = {};

    show.setlist_entries?.forEach((entry: any) => {
      if (entry.entry_placement.startsWith('Main Set')) {
        return;
      }

      const key = entry.entry_placement.replace(/\s+/g, '_');
      if (!placementEntries[key]) {
        placementEntries[key] = [];
      }
      placementEntries[key].push({
        song: entry.entry_song,
        setnum: entry.entry_setnum
      });
    });

    Object.entries(placementEntries).forEach(([key, entries]) => {
      entries.sort((a, b) => a.setnum - b.setnum);
      slots[key] = entries;
    });

    return slots;
  });
};
