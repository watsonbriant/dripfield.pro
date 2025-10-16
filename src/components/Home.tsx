import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import SetlistDisplay from './SetlistDisplay';
import { useNavigate } from 'react-router-dom';
import coverImage from '../img/Cover.jpg';
import gooseGif from '../img/Goose.gif';
import cover2 from '../img/Cover2.jpg';

interface Show {
  show_date: string;
  formatted_show_date: string;
  venue_location: string;
  show_subvenue: string;
  show_group: string;
  show_tour: string;
  show_detail: string | null;
  subvenue_venue?: string;
  show_iscanon?: boolean;
  show_id: string;
  venue_id?: string; // Added for venue navigation
}

interface SetlistEntry {
  entry_song: string;
  entry_short: string | null;
  entry_segue: string | null;
  entry_placement: string;
  entry_setorder: number;
  entry_set: string;
  entry_setnum: number;
  songs: {
    song_id: string;
  };
}

interface TopSong {
  song: string;
  song_id: string;
  play_count: number;
  category_canonid: number;
  category_artwork?: string;
}

interface ShowOpener {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

interface SetOpener {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

interface SetCloser {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

interface Encore {
  song_name: string;
  song_id: string;
  times_played: number;
  category_canonid: number;
  category_artwork?: string;
}

interface NotPlayedSong {
  song: string;
  song_id: string;
  play_count: number;
  category_canonid: number;
  category_artwork?: string;
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

export function Home() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [recentShows, setRecentShows] = useState<Show[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [historicalShows, setHistoricalShows] = useState<Show[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [mostRecentShow, setMostRecentShow] = useState<Show | null>(null);
  const [loadingMostRecent, setLoadingMostRecent] = useState(true);
  const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
  const [loadingSetlist, setLoadingSetlist] = useState(true);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [loadingTopSongs, setLoadingTopSongs] = useState(true);
  const [showOpeners, setShowOpeners] = useState<ShowOpener[]>([]);
  const [loadingShowOpeners, setLoadingShowOpeners] = useState(true);
  const [setOpeners, setSetOpeners] = useState<SetOpener[]>([]);
  const [loadingSetOpeners, setLoadingSetOpeners] = useState(true);
  const [setClosers, setSetClosers] = useState<SetCloser[]>([]);
  const [loadingSetClosers, setLoadingSetClosers] = useState(true);
  const [encores, setEncores] = useState<Encore[]>([]);
  const [loadingEncores, setLoadingEncores] = useState(true);
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([]);
  const [loadingNotPlayed, setLoadingNotPlayed] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | string>(new Date().getFullYear());
  const isAnyStatLoading = loadingTopSongs || loadingShowOpeners || loadingSetOpeners || loadingSetClosers || loadingEncores || loadingNotPlayed;

  useEffect(() => {
    const testConnection = async () => {
      try {
        await supabase.from('shows').select('show_id').limit(1);
      } catch (err) {
        // Error silently handled
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    // Reset all loading states when year changes
    setLoadingTopSongs(true);
    setLoadingShowOpeners(true);
    setLoadingSetOpeners(true);
    setLoadingSetClosers(true);
    setLoadingEncores(true);
    if (selectedYear !== 'all-time') {
      setLoadingNotPlayed(true);
    }
    // For the fetchRecentShows function
    async function fetchRecentShows() {
      try {
        const now = new Date();
        const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_date,
            show_id,
            show_canonid,
            show_venue_location,
            show_subvenue,
            show_group,
            show_tour,
            show_detail,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .lte('show_date', alaskaDate)
          .order('show_date', { ascending: false })  // Keep this initial sorting for database query
          .order('show_canonid', { ascending: false, nullsFirst: false })
          .order('show_group', { ascending: true })
          .limit(6);

        if (error) throw error;

        const processedShows = data
          ?.slice(1)
          .slice(0, 5)
          .map(show => ({
            show_id: show.show_id,
            show_date: show.show_date,
            formatted_show_date: show.show_date
              .split('-')
              .slice(1)
              .concat(show.show_date.substring(2, 4))
              .join('.'),
            venue_location: show.show_venue_location || '',
            show_subvenue: show.show_subvenue || '',
            show_group: show.show_group || '',
            show_tour: show.show_tour || '',
            show_detail: show.show_detail,
            subvenue_venue: show.show_subvenue_venue || '',
            venue_id: show.subvenues?.venues?.venue_id,
            show_canonid: show.show_canonid
          }));

        // Sort using the same logic as in Years component, but chronological (oldest to newest)
        const sortedShows = [...processedShows].sort((a, b) => {
          // Primary sort by show_date - chronological (oldest to newest)
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB; // Ascending order for dates (oldest first)
          }

          // Secondary sort by show_canonid (handle nulls appropriately)
          const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
          const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
          if (canonIdA !== canonIdB) {
            return canonIdA - canonIdB; // Ascending for canon IDs
          }

          // Tertiary sort by show_group
          const groupA = a.show_group || '';
          const groupB = b.show_group || '';
          return groupA.localeCompare(groupB);
        });

        setRecentShows(sortedShows || []);
      } catch (error) {
        // Error silently handled
      } finally {
        setLoading(false);
      }
    }

    // For the fetchUpcomingShows function
    async function fetchUpcomingShows() {
      try {
        const now = new Date();
        const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_date,
            show_id,
            show_canonid,
            show_venue_location,
            show_subvenue,
            show_group,
            show_tour,
            show_detail,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .gt('show_date', alaskaDate)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true })
          .limit(5);

        if (error) throw error;

        const processedShows = data?.map(show => ({
          show_id: show.show_id,
          show_date: show.show_date,
          formatted_show_date: show.show_date
            .split('-')
            .slice(1)
            .concat(show.show_date.substring(2, 4))
            .join('.'),
          venue_location: show.show_venue_location || '',
          show_subvenue: show.show_subvenue || '',
          show_group: show.show_group || '',
          show_tour: show.show_tour || '',
          show_detail: show.show_detail,
          subvenue_venue: show.show_subvenue_venue || '',
          venue_id: show.subvenues?.venues?.venue_id,
          show_canonid: show.show_canonid
        }));

        // Sort using the same logic as in Years component
        const sortedShows = [...processedShows].sort((a, b) => {
          // Primary sort by show_date
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB; // Ascending for upcoming shows
          }

          // Secondary sort by show_canonid (handle nulls appropriately)
          const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
          const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
          if (canonIdA !== canonIdB) {
            return canonIdA - canonIdB; // Ascending for upcoming shows
          }

          // Tertiary sort by show_group
          const groupA = a.show_group || '';
          const groupB = b.show_group || '';
          return groupA.localeCompare(groupB);
        });

        setUpcomingShows(sortedShows || []);
      } catch (error) {
        console.error('Error fetching upcoming shows:', error);
      } finally {
        setLoadingUpcoming(false);
      }
    }

    // For the fetchMostRecentShow function
    async function fetchMostRecentShow() {
      try {
        const now = new Date();
        const alaskaDate = formatInTimeZone(now, 'America/Anchorage', 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_date,
            show_id,
            show_canonid,
            show_venue_location,
            show_subvenue,
            show_group,
            show_tour,
            show_detail,
            show_iscanon,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .lte('show_date', alaskaDate)
          .order('show_date', { ascending: false })  // Most recent date first
          .order('show_canonid', { ascending: false, nullsFirst: false })  // Highest canon ID first
          .order('show_group', { ascending: true })  // Group alphabetically
          .limit(1)
          .single();

        if (error) throw error;

        if (data) {
          setMostRecentShow({
            show_id: data.show_id,
            show_date: data.show_date,
            formatted_show_date: data.show_date
              .split('-')
              .slice(1)
              .concat(data.show_date.substring(2, 4))
              .join('.'),
            venue_location: data.show_venue_location || '',
            show_subvenue: data.show_subvenue || '',
            show_group: data.show_group || '',
            show_tour: data.show_tour || '',
            show_detail: data.show_detail,
            show_iscanon: data.show_iscanon,
            subvenue_venue: data.show_subvenue_venue,
            venue_id: data.subvenues?.venues?.venue_id,
            show_canonid: data.show_canonid
          });

          // Now fetch the setlist for this most recent show
          fetchSetlist(data.show_id);
        }
      } catch (error) {
        console.error('Error fetching most recent show:', error);
      } finally {
        setLoadingMostRecent(false);
      }
    }

    // For the fetchSetlist function
    async function fetchSetlist(showId: string) {
      try {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            entry_short,
            entry_segue,
            entry_placement,
            entry_setorder,
            entry_set,
            entry_setnum,
            songs!inner(song_id)
          `)
          .eq('entry_show', showId)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true })
          .order('entry_setorder', { ascending: true });

        if (error) throw error;

        // Since setlists should always be in chronological order (as the show progressed),
        // we'll keep this ascending sorting which is already correct
        setSetlist(data || []);
      } catch (error) {
        console.error('Error fetching setlist:', error);
      } finally {
        setLoadingSetlist(false);
      }
    }

    async function fetchSetlist(showId: string) {
      try {
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            entry_short,
            entry_segue,
            entry_placement,
            entry_setorder,
            entry_set,
            entry_setnum,
            songs!inner(song_id)
          `)
          .eq('entry_show', showId)
          .order('entry_set', { ascending: true })
          .order('entry_setnum', { ascending: true })
          .order('entry_setorder', { ascending: true });

        if (error) throw error;

        setSetlist(data || []);
      } catch (error) {
        console.error('Error fetching setlist:', error);
      } finally {
        setLoadingSetlist(false);
      }
    }

    // For the fetchHistoricalShows function too
    async function fetchHistoricalShows() {
      try {
        const now = new Date();
        const month = formatInTimeZone(now, 'America/Anchorage', 'MM');
        const day = formatInTimeZone(now, 'America/Anchorage', 'dd');
        const todayMMDD = `${month}-${day}`;

        const { data, error } = await supabase
          .from('shows')
          .select(`
            show_date,
            show_id,
            show_canonid,
            show_venue_location,
            show_subvenue,
            show_group,
            show_tour,
            show_detail,
            show_subvenue_venue,
            subvenues:show_subvenue(
              venues:subvenue_venue(
                venue_id
              )
            )
          `)
          .eq('show_day', todayMMDD)
          .order('show_date', { ascending: true })
          .order('show_canonid', { ascending: true, nullsFirst: true })
          .order('show_group', { ascending: true });

        if (error) throw error;

        const processedShows = data?.map(show => ({
          show_id: show.show_id,
          show_date: show.show_date,
          formatted_show_date: show.show_date
            .split('-')
            .slice(1)
            .concat(show.show_date.substring(2, 4))
            .join('.'),
          venue_location: show.show_venue_location || '',
          show_subvenue: show.show_subvenue || '',
          show_group: show.show_group || '',
          show_tour: show.show_tour || '',
          show_detail: show.show_detail,
          subvenue_venue: show.show_subvenue_venue || '',
          venue_id: show.subvenues?.venues?.venue_id,
          show_canonid: show.show_canonid
        }));

        // Sort using the same logic as in Years component
        const sortedShows = [...processedShows].sort((a, b) => {
          // Primary sort by show_date
          const dateA = new Date(a.show_date).getTime();
          const dateB = new Date(b.show_date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB; // Ascending for historical shows
          }

          // Secondary sort by show_canonid (handle nulls appropriately)
          const canonIdA = a.show_canonid === null ? -1 : a.show_canonid;
          const canonIdB = b.show_canonid === null ? -1 : b.show_canonid;
          if (canonIdA !== canonIdB) {
            return canonIdA - canonIdB; // Ascending for historical shows
          }

          // Tertiary sort by show_group
          const groupA = a.show_group || '';
          const groupB = b.show_group || '';
          return groupA.localeCompare(groupB);
        });

        setHistoricalShows(sortedShows || []);
      } catch (error) {
        console.error('Error fetching historical shows:', error);
      } finally {
        setLoadingHistorical(false);
      }
    }

    async function fetchTopSongs() {
      try {
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              entry_show,
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null);
          
          // Only apply date filters if not "all-time"
          if (selectedYear !== 'all-time') {
            query = query
              .gte('shows.show_date', `${selectedYear}-01-01`)
              .lte('shows.show_date', `${selectedYear}-12-31`);
          }
          
          const { data, error } = await query.range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        const songShowCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songId = entry.songs.song_id;
          const showId = entry.entry_show;

          if (!acc[songId]) {
            acc[songId] = {
              song: entry.entry_song,
              song_id: songId,
              shows: new Set([showId]),
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songId].shows.add(showId);
          }
          return acc;
        }, {});

        const processedSongs = Object.values(songShowCounts)
          .map((item: any) => ({
            song: item.song,
            song_id: item.song_id,
            play_count: item.shows.size,
            category_canonid: item.category_canonid,
            category_artwork: item.category_artwork
          }))
          .sort((a: any, b: any) => {
            if (b.play_count !== a.play_count) {
              return b.play_count - a.play_count;
            }
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            return a.song.localeCompare(b.song);
          })
          .slice(0, 8);

        setTopSongs(processedSongs);
      } catch (error) {
        console.error('Error fetching top songs:', error);
      } finally {
        setLoadingTopSongs(false);
      }
    }

    async function fetchShowOpeners() {
      try {
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null)
            .eq('entry_placement', 'Set 1 Opener');
          
          // Only apply date filters if not "all-time"
          if (selectedYear !== 'all-time') {
            query = query
              .gte('shows.show_date', `${selectedYear}-01-01`)
              .lte('shows.show_date', `${selectedYear}-12-31`);
          }
          
          const { data, error } = await query.range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songName].times_played++;
          }
          return acc;
        }, {});

        const processedOpeners = Object.values(openerCounts)
          .sort((a: any, b: any) => {
            if (b.times_played !== a.times_played) {
              return b.times_played - a.times_played;
            }
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            return a.song_name.localeCompare(b.song_name);
          })
          .slice(0, 8);

        setShowOpeners(processedOpeners);
      } catch (error) {
        console.error('Error fetching show openers:', error);
      } finally {
        setLoadingShowOpeners(false);
      }
    }

    async function fetchSetOpeners() {
      try {
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null)
            .in('entry_placement', ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener']);
          
          // Only apply date filters if not "all-time"
          if (selectedYear !== 'all-time') {
            query = query
              .gte('shows.show_date', `${selectedYear}-01-01`)
              .lte('shows.show_date', `${selectedYear}-12-31`);
          }
          
          const { data, error } = await query.range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        const openerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songName].times_played++;
          }
          return acc;
        }, {});

        const processedOpeners = Object.values(openerCounts)
          .sort((a: any, b: any) => {
            if (b.times_played !== a.times_played) {
              return b.times_played - a.times_played;
            }
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            return a.song_name.localeCompare(b.song_name);
          })
          .slice(0, 8);

        setSetOpeners(processedOpeners);
      } catch (error) {
        console.error('Error fetching set openers:', error);
      } finally {
        setLoadingSetOpeners(false);
      }
    }

    async function fetchSetClosers() {
      try {
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null)
            .in('entry_placement', ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer']);
          
          // Only apply date filters if not "all-time"
          if (selectedYear !== 'all-time') {
            query = query
              .gte('shows.show_date', `${selectedYear}-01-01`)
              .lte('shows.show_date', `${selectedYear}-12-31`);
          }
          
          const { data, error } = await query.range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        const closerCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songName].times_played++;
          }
          return acc;
        }, {});

        const processedClosers = Object.values(closerCounts)
          .sort((a: any, b: any) => {
            if (b.times_played !== a.times_played) {
              return b.times_played - a.times_played;
            }
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            return a.song_name.localeCompare(b.song_name);
          })
          .slice(0, 8);

        setSetClosers(processedClosers);
      } catch (error) {
        console.error('Error fetching set closers:', error);
      } finally {
        setLoadingSetClosers(false);
      }
    }

    async function fetchEncores() {
      try {
        const allData = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('setlist_entries')
            .select(`
              entry_song,
              songs!inner(
                song_id,
                song_category,
                categories!inner(
                  category_canonid,
                  category_artwork
                )
              ),
              shows!inner(
                show_date,
                show_group,
                show_canonid
              )
            `)
            .eq('shows.show_group', 'Goose')
            .not('shows.show_canonid', 'is', null)
            .in('entry_placement', ['Encore 1', 'Encore 2', 'Encore 3']);
          
          // Only apply date filters if not "all-time"
          if (selectedYear !== 'all-time') {
            query = query
              .gte('shows.show_date', `${selectedYear}-01-01`)
              .lte('shows.show_date', `${selectedYear}-12-31`);
          }
          
          const { data, error } = await query.range(from, from + batchSize - 1);

          if (error) throw error;

          allData.push(...(data || []));
          
          if (!data || data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        }

        const encoreCounts = allData.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid,
              category_artwork: entry.songs.categories.category_artwork
            };
          } else {
            acc[songName].times_played++;
          }
          return acc;
        }, {});

        const processedEncores = Object.values(encoreCounts)
          .sort((a: any, b: any) => {
            if (b.times_played !== a.times_played) {
              return b.times_played - a.times_played;
            }
            if (a.category_canonid !== b.category_canonid) {
              return a.category_canonid - b.category_canonid;
            }
            return a.song_name.localeCompare(b.song_name);
          })
          .slice(0, 8);

        setEncores(processedEncores);
      } catch (error) {
        console.error('Error fetching encores:', error);
      } finally {
        setLoadingEncores(false);
      }
    }

    async function fetchNotPlayedSongs() {
      // Skip this function entirely for all-time
      if (selectedYear === 'all-time') {
        setNotPlayedSongs([]);
        setLoadingNotPlayed(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .rpc('get_most_common_not_played_songs', { 
            selected_year: selectedYear 
          });
    
        if (error) throw error;
    
        setNotPlayedSongs(data || []);
      } catch (error) {
        console.error('Error fetching not played songs:', error);
      } finally {
        setLoadingNotPlayed(false);
      }
    }

    fetchMostRecentShow();
    fetchRecentShows();
    fetchUpcomingShows();
    fetchHistoricalShows();
    fetchTopSongs();
    fetchShowOpeners();
    fetchSetOpeners();
    fetchSetClosers();
    fetchEncores();
    fetchNotPlayedSongs();
  }, [selectedYear]);

  // Helper function to navigate to venue page
  const navigateToVenue = (show: Show) => {
    if (show.venue_id) {
      navigate(`/venue/${show.venue_id}`);
    } else if (show.subvenue_venue) {
      // If we don't have venue_id but have the venue name, we can use that
      navigate(`/venue/${encodeURIComponent(show.subvenue_venue)}`);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      {!isSupabaseConfigured() && (
        <div className="bg-primary border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-fifth">
            Please connect to Supabase using the button in the top right to view setlist data.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Left Column - adjust width based on image aspect ratio */}
        <div className="w-full lg:w-[43%] space-y-4 mr-4">
          {/* Logo container with natural height on mobile, fixed on desktop */}
          <div className="h-auto md:h-[204.05px] overflow-hidden rounded-lg flex items-center justify-center">
            <img
              src={cover2}
              alt="Dripfield.pro logo"
              className="hidden md:block h-full w-auto border border-secondary rounded-lg object-contain"
            />
            <img
              src={cover2}
              alt="Dripfield.pro logo"
              className="block md:hidden h-auto w-auto border border-secondary rounded-lg"
            />
          </div>

          {/* Last 5 Shows Table */}
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">Last 5 Shows</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-fifth/70">Loading shows...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-white/5">
                    {recentShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                          } hover:bg-tertiary/40 transition-colors text-xs text-fifth`}
                      >
                        <td
                          className="px-4 py-0.5 whitespace-nowrap cursor-pointer relative"
                          onMouseEnter={(e) => {
                            setHoveredDate(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDate(null)}
                        >
                          <button
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                            className="transition-colors table-link"
                          >
                            <span className="font-medium text-fifth">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><span className="font-medium">{show.show_group}</span></div>}
                              {show.show_tour && <div><span className="font-light">{show.show_tour}</span></div>}
                              {show.show_detail && <div><span className="font-light">{show.show_detail}</span></div>}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-0.5 relative cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredLocation(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredLocation(null)}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => navigateToVenue(show)}
                              className="font-light hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <div className="flex-shrink-0 ml-2">
                                <img
                                  src={gooseGif}
                                  alt="Goose"
                                  className="h-4 w-4 filter drop-shadow-lg"
                                  style={{
                                    filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary font-medium shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_subvenue}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Most Recent Show Section */}
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary">Most Recent Show</h2>
              {mostRecentShow && mostRecentShow.show_group === 'Goose' && (
                <div className="flex-shrink-0">
                  <img
                    src={gooseGif}
                    alt="Goose"
                    className="h-6 w-6 filter drop-shadow-lg"
                    style={{
                      filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
                    }}
                  />
                </div>
              )}
            </div>
            {loadingMostRecent ? (
              <div className="text-center py-12">
                <p className="text-fifth/70">Loading show...</p>
              </div>
            ) : mostRecentShow ? (
              <div>
                <div className="mb-2 text-lg text-fifth font-medium">
                  <div className="text-base">
                    <button
                      onClick={() => navigate(`/setlist/${mostRecentShow.show_id}`)}
                      className="transition-colors table-link"
                    >
                      {mostRecentShow.formatted_show_date}
                    </button>
                    {" — "}
                    <button
                      onClick={() => navigateToVenue(mostRecentShow)}
                      className="transition-colors table-link"
                    >
                      {mostRecentShow.venue_location}
                    </button>
                    <br />
                    <span className="font-semibold">{mostRecentShow.show_group}</span>
                  </div>
                </div>

                {loadingSetlist ? (
                  <div className="text-center py-4">
                    <p className="text-fifth/70">Loading setlist...</p>
                  </div>
                ) : setlist.length > 0 ? (
                  <SetlistDisplay setlist={setlist} navigate={navigate} />
                ) : (
                  <div>
                    <p className="text-fifth text-sm">Setlist not available.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-fifth/70">No recent shows found</p>
              </div>
            )}
          </div>

          {/* Next 5 Shows Table */}
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">Next 5 Shows</h2>
            {loadingUpcoming ? (
              <div className="text-center py-12">
                <p className="text-fifth/70">Loading shows...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-white/5">
                    {upcomingShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                          } hover:bg-tertiary/40 transition-colors text-xs text-fifth`}
                      >
                        <td
                          className="px-4 py-0.5 whitespace-nowrap cursor-pointer relative"
                          onMouseEnter={(e) => {
                            setHoveredDate(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDate(null)}
                        >
                          <button
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                            className="transition-colors table-link"
                          >
                            <span className="font-medium text-fifth">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><span className="font-medium">{show.show_group}</span></div>}
                              {show.show_tour && <div><span className="font-light">{show.show_tour}</span></div>}
                              {show.show_detail && <div><span className="font-light">{show.show_detail}</span></div>}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-0.5 relative cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredLocation(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredLocation(null)}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => navigateToVenue(show)}
                              className="font-light hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <div className="flex-shrink-0 ml-2">
                                <img
                                  src={gooseGif}
                                  alt="Goose"
                                  className="h-4 w-4 filter drop-shadow-lg"
                                  style={{
                                    filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary font-medium shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_subvenue}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* This Day in Goose History Table */}
          <div className="bg-primary border border-secondary rounded-lg p-3">
            <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-0.25 rounded-lg border border-secondary mb-2">This Day in Goose History</h2>
            {loadingHistorical ? (
              <div className="text-center py-2 text-xs">
                <p className="text-fifth/70">Loading shows...</p>
              </div>
            ) : historicalShows.length === 0 ? (
              <div className="text-center py-2 text-sm">
                <p className="text-fifth font-semibold">No shows occurred on this date in Goose history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-white/5">
                    {historicalShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                          } hover:bg-tertiary/40 transition-colors text-xs text-fifth`}
                      >
                        <td
                          className="px-4 py-0.5 whitespace-nowrap cursor-pointer relative"
                          onMouseEnter={(e) => {
                            setHoveredDate(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredDate(null)}
                        >
                          <button
                            onClick={() => navigate(`/setlist/${show.show_id}`)}
                            className="transition-colors table-link"
                          >
                            <span className="font-medium text-fifth">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><span className="font-medium">{show.show_group}</span></div>}
                              {show.show_tour && <div><span className="font-light">{show.show_tour}</span></div>}
                              {show.show_detail && <div><span className="font-light">{show.show_detail}</span></div>}
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-0.5 relative cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredLocation(show.show_id);
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setMousePosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredLocation(null)}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => navigateToVenue(show)}
                              className="font-light hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <div className="flex-shrink-0 ml-2">
                                <img
                                  src={gooseGif}
                                  alt="Goose"
                                  className="h-4 w-4 filter drop-shadow-lg"
                                  style={{
                                    filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 5))'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-tertiary text-fifth px-3 py-1 rounded border border-secondary font-medium shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_subvenue}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - adjust width based on image aspect ratio */}
        <div className="w-full lg:w-[57%] space-y-4">
          {/* Cover Image with fixed height - hidden on mobile */}
          <div className="hidden md:block overflow-hidden rounded-lg">
            <img
              src={coverImage}
              alt="Dripfield.pro banner"
              className="w-full h-full object-cover border border-secondary rounded-lg shadow-lg"
            />
          </div>

          {/* Stats Section */}
          <div className="bg-primary border border-secondary rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary mb-2">
                {selectedYear === 'all-time' ? 'All-Time' : selectedYear} Stats
              </h2>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all-time' ? 'all-time' : Number(e.target.value))}
                className="bg-tertiary text-fifth px-4 py-1.5 rounded-lg border border-secondary hover:bg-primary transition-colors text-base font-semibold appearance-none pr-10 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none "
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="all-time">All-Time</option>
                {Array.from({ length: 12 }, (_, i) => 2025 - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className={`${isAnyStatLoading ? 'opacity-20' : ''} transition-opacity duration-300`}>
              {/* Desktop view - 2 columns, hidden on mobile */}
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* Left column for desktop */}
                <div>
                  {/* Top Songs */}
                  {topSongs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-fourth">Top Songs Played</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {topSongs.map((song, index) => (
                            <tr
                              key={song.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${song.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(song.song)}
                                  </button>
                                  {song.category_artwork && (
                                    <img
                                      src={song.category_artwork}
                                      alt={`${song.song} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {song.play_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Top Show Openers */}
                  {showOpeners.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#047857]">Top Show Openers</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {showOpeners.map((opener, index) => (
                            <tr
                              key={opener.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${opener.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(opener.song_name)}
                                  </button>
                                  {opener.category_artwork && (
                                    <img
                                      src={opener.category_artwork}
                                      alt={`${opener.song_name} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {opener.times_played}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Top Set Closers */}
                  {setClosers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#3b82f6]">Top Set Closers</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {setClosers.map((closer, index) => (
                            <tr
                              key={closer.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${closer.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(closer.song_name)}
                                  </button>
                                  {closer.category_artwork && (
                                    <img
                                      src={closer.category_artwork}
                                      alt={`${closer.song_name} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {closer.times_played}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}
                </div>
                

                {/* Right column for desktop */}
                <div>
                  {/* Most Common Not Played */}
                  {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">Most Common Not Played</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {notPlayedSongs.map((song, index) => (
                            <tr
                              key={song.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${song.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(song.song)}
                                  </button>
                                  {song.category_artwork && (
                                    <img
                                      src={song.category_artwork}
                                      alt={`${song.song} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {song.play_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Top Set Openers */}
                  {setOpeners.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#10b981]">Top Set Openers</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {setOpeners.map((opener, index) => (
                            <tr
                              key={opener.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${opener.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(opener.song_name)}
                                  </button>
                                  {opener.category_artwork && (
                                    <img
                                      src={opener.category_artwork}
                                      alt={`${opener.song_name} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {opener.times_played}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}

                  {/* Top Encores */}
                  {encores.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#be123c]">Top Encores</h3>
                    <div className="overflow-x-auto relative">
                      <table className="w-full border-collapse">
                        <tbody className="divide-y divide-white/5">
                          {encores.map((encore, index) => (
                            <tr
                              key={encore.song_id}
                              className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                } hover:bg-tertiary/40 transition-colors text-xs`}
                            >
                              <td className="pl-4 text-fifth">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => navigate(`/song/${encore.song_id}`)}
                                    className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                  >
                                    {cleanSongName(encore.song_name)}
                                  </button>
                                  {encore.category_artwork && (
                                    <img
                                      src={encore.category_artwork}
                                      alt={`${encore.song_name} artwork`}
                                      className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                                {encore.times_played}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Mobile view - single column in custom order, hidden on desktop */}
              <div className="md:hidden space-y-6">
                {/* 1. Top Songs */}
                {topSongs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-fourth">Top Songs Played</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {topSongs.map((song, index) => (
                          <tr
                            key={song.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${song.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(song.song)}
                                </button>
                                {song.category_artwork && (
                                  <img
                                    src={song.category_artwork}
                                    alt={`${song.song} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {song.play_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* 2. Most Common Not Played */}
                {selectedYear !== 'all-time' && notPlayedSongs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">Most Common Not Played</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {notPlayedSongs.map((song, index) => (
                          <tr
                            key={song.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${song.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(song.song)}
                                </button>
                                {song.category_artwork && (
                                  <img
                                    src={song.category_artwork}
                                    alt={`${song.song} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {song.play_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* 3. Top Show Openers */}
                {showOpeners.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#047857]">Top Show Openers</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {showOpeners.map((opener, index) => (
                          <tr
                            key={opener.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${opener.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(opener.song_name)}
                                </button>
                                {opener.category_artwork && (
                                  <img
                                    src={opener.category_artwork}
                                    alt={`${opener.song_name} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {opener.times_played}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* 4. Top Set Openers */}
                {setOpeners.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#10b981]">Top Set Openers</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {setOpeners.map((opener, index) => (
                          <tr
                            key={opener.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${opener.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(opener.song_name)}
                                </button>
                                {opener.category_artwork && (
                                  <img
                                    src={opener.category_artwork}
                                    alt={`${opener.song_name} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {opener.times_played}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* 5. Top Set Closers */}
                {setClosers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#3b82f6]">Top Set Closers</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {setClosers.map((closer, index) => (
                          <tr
                            key={closer.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${closer.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(closer.song_name)}
                                </button>
                                {closer.category_artwork && (
                                  <img
                                    src={closer.category_artwork}
                                    alt={`${closer.song_name} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {closer.times_played}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}

                {/* 6. Top Encores */}
                {encores.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1 rounded-lg border border-secondary inline-block px-3 bg-[#be123c]">Top Encores</h3>
                  <div className="overflow-x-auto relative">
                    <table className="w-full border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {encores.map((encore, index) => (
                          <tr
                            key={encore.song_id}
                            className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                              } hover:bg-tertiary/40 transition-colors text-xs`}
                          >
                            <td className="pl-4 text-fifth">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => navigate(`/song/${encore.song_id}`)}
                                  className="font-trad text-fifth text-[1rem] leading-[0.875rem] pb-0.5 hover:underline cursor-pointer text-left"
                                >
                                  {cleanSongName(encore.song_name)}
                                </button>
                                {encore.category_artwork && (
                                  <img
                                    src={encore.category_artwork}
                                    alt={`${encore.song_name} artwork`}
                                    className="w-5 h-5 rounded-full object-cover border border-secondary ml-3"
                                    onError={(e) => {
                                      // Hide the image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                            <td className="pr-2 w-[40px] py-0.5 text-center font-medium text-fifth">
                              {encore.times_played}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}