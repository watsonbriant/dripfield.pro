import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SetlistEntry } from '../types/setlist';

export interface WtedShow {
  show: string;
  order: number | null;
}

export interface WtedEpisode {
  episode: string;
  order: number | null;
  uuid: string;
  show: string;
  artwork: string | null;
}

export interface WtedEpisodeEntry {
  song: string; // foreign key to setlist_entries.entry_id
  order: number | null;
  set: string | null;
  placement: string | null;
  setlist_entry?: SetlistEntry;
  show_date?: string | null;
  show_venue_location?: string | null;
  show_id?: string | null;
  venue_id?: string | null;
  show_group?: string | null;
}

export function useWtedEpisodeData(episodeId: string | undefined) {
  const [episode, setEpisode] = useState<WtedEpisode | null>(null);
  const [show, setShow] = useState<WtedShow | null>(null);
  const [entries, setEntries] = useState<WtedEpisodeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEpisodeData() {
      if (!episodeId) return;

      try {
        // Fetch episode details
        const { data: episodeData, error: episodeError } = await supabase
          .from('wted_episodes')
          .select('episode, order, uuid, show, artwork')
          .eq('uuid', episodeId)
          .single();

        if (episodeError) throw episodeError;
        
        setEpisode(episodeData as WtedEpisode);

        // Fetch show details
        if (episodeData.show) {
          const { data: showData, error: showError } = await supabase
            .from('wted_shows')
            .select('show, order')
            .eq('show', episodeData.show)
            .single();

          if (!showError && showData) {
            setShow(showData as WtedShow);
          }
        }

        // Fetch episode entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('wted_episode_entries')
          .select('song, order, set, placement')
          .eq('episode', episodeId)
          .order('set', { ascending: true })
          .order('order', { ascending: true });

        if (entriesError) throw entriesError;

        // Fetch setlist entries for each song reference
        if (entriesData && entriesData.length > 0) {
          const entryIds = entriesData.map(e => e.song).filter(Boolean);
          
          const { data: setlistData, error: setlistError } = await supabase
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
              entry_setorder,
              songs (
                song_id,
                song_category,
                song_originalartist,
                categories (
                  category_canonid,
                  category_artwork
                )
              ),
              setlist_entry_guests(
                guest_id,
                guests(
                  guest_displayname,
                  guest_canonid,
                  guest_instrument
                )
              ),
              shows (
                show_id,
                show_date,
                show_venue_location,
                show_group,
                subvenues (
                  subvenue_venue,
                  venues (
                    venue_id
                  )
                )
              )
            `)
            .in('entry_id', entryIds);

          if (setlistError) throw setlistError;

          // Map setlist entries to episode entries
          const processedEntries = entriesData.map(entry => {
            const setlistEntry = setlistData?.find(se => se.entry_id === entry.song);
            
            if (setlistEntry) {
              const showData = setlistEntry.shows as any;
              return {
                ...entry,
                show_date: showData?.show_date || null,
                show_venue_location: showData?.show_venue_location || null,
                show_id: showData?.show_id || null,
                venue_id: showData?.subvenues?.venues?.venue_id || null,
                show_group: showData?.show_group || null,
                setlist_entry: {
                  ...setlistEntry,
                  song_id: setlistEntry.songs?.song_id || '',
                  song_category: setlistEntry.songs?.song_category || '',
                  song_originalartist: setlistEntry.songs?.song_originalartist || null,
                  category_canonid: setlistEntry.songs?.categories?.category_canonid || 0,
                  guests: (setlistEntry.setlist_entry_guests as any)?.map((guest: any) => ({
                    guest_id: guest.guest_id,
                    guest_display_name: guest.guests?.guest_displayname,
                    guest_canonid: guest.guests?.guest_canonid,
                    guest_instrument: guest.guests?.guest_instrument
                  })).filter((g: any) => g.guest_display_name) || [],
                  songs: setlistEntry.songs || {
                    song_id: '',
                    song_category: '',
                    song_originalartist: null,
                    categories: {
                      category_canonid: 0,
                      category_artwork: null
                    }
                  }
                } as SetlistEntry
              };
            }
            
            return entry;
          });

          setEntries(processedEntries);
        } else {
          setEntries([]);
        }
      } catch (error) {
        console.error('Error fetching WTED episode data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEpisodeData();
  }, [episodeId]);

  return { episode, show, entries, loading };
}

export function useWtedEpisodes(showName: string | undefined) {
  const [episodes, setEpisodes] = useState<WtedEpisode[]>([]);

  useEffect(() => {
    async function fetchEpisodes() {
      if (!showName) {
        setEpisodes([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wted_episodes')
          .select('episode, order, uuid, show, artwork')
          .eq('show', showName)
          .not('artwork', 'is', null)
          .order('order', { ascending: true });

        if (error) throw error;
        // Filter to only episodes with artwork (non-null and non-empty)
        const episodesWithArtwork = (data || []).filter(
          episode => episode.artwork && episode.artwork.trim() !== ''
        );
        setEpisodes(episodesWithArtwork);
      } catch (error) {
        console.error('Error fetching WTED episodes:', error);
        setEpisodes([]);
      }
    }

    fetchEpisodes();
  }, [showName]);

  return { episodes };
}

