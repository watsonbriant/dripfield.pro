import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatInTimeZone } from 'date-fns-tz';
import SetlistDisplay from './SetlistDisplay';
import { useNavigate } from 'react-router-dom';
import coverImage from '../img/Cover.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBluesky } from '@fortawesome/free-brands-svg-icons';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
import gooseGif from '../img/Goose.gif';

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
}

interface ShowOpener {
  song_name: string;
  song_id: string;
  times_played: number;
}

interface SetOpener {
  song_name: string;
  song_id: string;
  times_played: number;
}

interface SetCloser {
  song_name: string;
  song_id: string;
  times_played: number;
}

interface Encore {
  song_name: string;
  song_id: string;
  times_played: number;
}

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
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsFirst: false })
          .order('show_group', { ascending: true })
          .order('show_id', { ascending: true })
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
            venue_id: show.subvenues?.venues?.venue_id
          }))
          .sort((a, b) => new Date(a.show_date).getTime() - new Date(b.show_date).getTime());

        setRecentShows(processedShows || []);
      } catch (error) {
        // Error silently handled
      } finally {
        setLoading(false);
      }
    }

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
          venue_id: show.subvenues?.venues?.venue_id
        }));

        setUpcomingShows(processedShows || []);
      } catch (error) {
        console.error('Error fetching upcoming shows:', error);
      } finally {
        setLoadingUpcoming(false);
      }
    }

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
          .order('show_date', { ascending: false })
          .order('show_canonid', { ascending: false, nullsFirst: false })
          .order('show_group', { ascending: true })
          .order('show_id', { ascending: true })
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
            venue_id: data.subvenues?.venues?.venue_id
          });
          fetchSetlist(data.show_id);
        }
      } catch (error) {
        console.error('Error fetching most recent show:', error);
      } finally {
        setLoadingMostRecent(false);
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
          .order('show_date', { ascending: true });
    
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
          venue_id: show.subvenues?.venues?.venue_id
        }));
    
        setHistoricalShows(processedShows || []);
      } catch (error) {
        console.error('Error fetching historical shows:', error);
      } finally {
        setLoadingHistorical(false);
      }
    }

    async function fetchTopSongs() {
      try {
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
              )
            ),
            entry_show,
            shows!inner(
              show_date,
              show_group
            )
          `)
          .eq('shows.show_group', 'Goose')
          .gte('shows.show_date', `${currentYear}-01-01`)
          .lte('shows.show_date', `${currentYear}-12-31`);
    
        if (error) throw error;
    
        const songShowCounts = data.reduce((acc: { [key: string]: any }, entry: any) => {
          const songId = entry.songs.song_id;
          const showId = entry.entry_show;
          const uniqueKey = `${songId}-${showId}`;
    
          if (!acc[songId]) {
            acc[songId] = {
              song: entry.entry_song,
              song_id: songId,
              shows: new Set([showId]),
              category_canonid: entry.songs.categories.category_canonid
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
            category_canonid: item.category_canonid
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
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
              )
            ),
            shows!inner(
              show_date,
              show_group
            )
          `)
          .eq('shows.show_group', 'Goose')
          .eq('entry_placement', 'Set 1 Opener')
          .gte('shows.show_date', `${currentYear}-01-01`)
          .lte('shows.show_date', `${currentYear}-12-31`);
    
        if (error) throw error;
    
        const openerCounts = data.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid
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
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
              )
            ),
            shows!inner(
              show_date,
              show_group
            )
          `)
          .eq('shows.show_group', 'Goose')
          .in('entry_placement', ['Set 1 Opener', 'Set 2 Opener', 'Set 3 Opener', 'Set 4 Opener', 'Set 5 Opener'])
          .gte('shows.show_date', `${currentYear}-01-01`)
          .lte('shows.show_date', `${currentYear}-12-31`);
    
        if (error) throw error;
    
        const openerCounts = data.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid
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
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
              )
            ),
            shows!inner(
              show_date,
              show_group
            )
          `)
          .eq('shows.show_group', 'Goose')
          .in('entry_placement', ['Set 1 Closer', 'Set 2 Closer', 'Set 3 Closer', 'Set 4 Closer', 'Set 5 Closer'])
          .gte('shows.show_date', `${currentYear}-01-01`)
          .lte('shows.show_date', `${currentYear}-12-31`);
    
        if (error) throw error;
    
        const closerCounts = data.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid
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
        const currentYear = new Date().getFullYear();
        const { data, error } = await supabase
          .from('setlist_entries')
          .select(`
            entry_song,
            songs!inner(
              song_id,
              song_category,
              categories!inner(
                category_canonid
              )
            ),
            shows!inner(
              show_date,
              show_group
            )
          `)
          .eq('shows.show_group', 'Goose')
          .in('entry_placement', ['Encore 1', 'Encore 2', 'Encore 3'])
          .gte('shows.show_date', `${currentYear}-01-01`)
          .lte('shows.show_date', `${currentYear}-12-31`);
    
        if (error) throw error;
    
        const encoreCounts = data.reduce((acc: { [key: string]: any }, entry: any) => {
          const songName = entry.entry_song;
          if (!acc[songName]) {
            acc[songName] = {
              song_name: songName,
              song_id: entry.songs.song_id,
              times_played: 1,
              category_canonid: entry.songs.categories.category_canonid
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

    fetchMostRecentShow();
    fetchRecentShows();
    fetchUpcomingShows();
    fetchHistoricalShows();
    fetchTopSongs();
    fetchShowOpeners();
    fetchSetOpeners();
    fetchSetClosers();
    fetchEncores();
  }, []);

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
    <div className="max-w-[800px] mx-auto">
      {!isSupabaseConfigured() && (
        <div className="bg-primary border border-white/10 rounded-lg p-4 mb-6">
          <p className="text-[#fce7ca]/90">
            Please connect to Supabase using the button in the top right to view setlist data.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <a 
          href="https://bsky.app/profile/dripfieldpro.bsky.social" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-2"
        >
          <FontAwesomeIcon 
            icon={faBluesky} 
            size="2x" 
            style={{ color: '#ffffff' }} 
          />
        </a>
        
        <div className="text-center flex-grow">
          <h1 className="text-3xl font-bold text-[#ffffff]">
            <span className="hidden md:inline">Welcome to </span>
            Dripfield.pro<span className="hidden md:inline">!</span>
          </h1>
          
          <h4 className="text-sm font-semibold text-[#ffffff] mt-1">
            A Setlist Archive for Goose the Band
          </h4>
        </div>
        
        <a 
          href="https://x.com/dripfieldpro" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mr-2"
        >
          <FontAwesomeIcon 
            icon={faXTwitter} 
            size="2x" 
            style={{ color: '#ffffff' }} 
          />
        </a>
      </div>

      <div className="mb-6">
        <img 
          src={coverImage} 
          alt="Dripfield.pro banner" 
          className="w-full max-w-4xl rounded-lg shadow-lg" 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2">
          {/* Last 5 Shows Table */}
          <div className="mb-6 flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-3">
            <h2 className="text-xl font-semibold text-white/90 mb-2">Last 5 Shows</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading shows...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Date</th>
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap cursor-pointer relative"
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
                            className="hover:text-white transition-colors table-link"
                          >
                            <span className="font-semibold">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><strong>{show.show_group}</strong></div>}
                              {show.show_tour && <div>{show.show_tour}</div>}
                              {show.show_detail && <div>{show.show_detail}</div>}
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 relative cursor-pointer"
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
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <img src={gooseGif} alt="Goose" className="h-4 w-4 ml-2" />
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg whitespace-nowrap z-[9999]"
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
          <div className="mb-6 flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-3">
            <h2 className="text-xl font-semibold text-white/90 mb-2">Most Recent Show</h2>
            {loadingMostRecent ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading show...</p>
              </div>
            ) : mostRecentShow ? (
              <div>
                <div className="mb-2 text-lg text-[#fce7ca]">
                  <div className="text-base">
                    <button
                      onClick={() => navigate(`/setlist/${mostRecentShow.show_id}`)}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      <strong>{mostRecentShow.formatted_show_date}</strong>
                    </button>
                    {" — "}
                    <button
                      onClick={() => navigateToVenue(mostRecentShow)}
                      className="hover:text-white hover:underline transition-colors"
                    >
                      <strong>{mostRecentShow.venue_location}</strong>
                    </button>
                    <br />
                    <strong>{mostRecentShow.show_group}</strong>
                  </div>
                </div>
                
                {loadingSetlist ? (
                  <div className="text-center py-4">
                    <p className="text-[#fce7ca]/70">Loading setlist...</p>
                  </div>
                ) : setlist.length > 0 ? (
                  <SetlistDisplay setlist={setlist} navigate={navigate} />
                ) : (
                  <div>
                    <p className="text-white text-sm">Setlist not available.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">No recent shows found</p>
              </div>
            )}
          </div>
          
          {/* Next 5 Shows Table */}
          <div className="mb-6 flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-3">
            <h2 className="text-xl font-semibold text-white/90 mb-2">Next 5 Shows</h2>
            {loadingUpcoming ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading shows...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Date</th>
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {upcomingShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap cursor-pointer relative"
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
                            className="hover:text-white transition-colors table-link"
                          >
                            <span className="font-semibold">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><strong>{show.show_group}</strong></div>}
                              {show.show_tour && <div>{show.show_tour}</div>}
                              {show.show_detail && <div>{show.show_detail}</div>}
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 relative cursor-pointer"
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
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <img src={gooseGif} alt="Goose" className="h-4 w-4 ml-2" />
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg whitespace-nowrap z-[9999]"
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
          <div className="flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-3">
            <h2 className="text-xl font-semibold text-white/90 mb-2">This Day in Goose History</h2>
            {loadingHistorical ? (
              <div className="text-center py-2 text-xs">
                <p className="text-[#fce7ca]/70">Loading shows...</p>
              </div>
            ) : historicalShows.length === 0 ? (
              <div className="text-center py-2 text-xs">
                <p className="text-[#fce7ca]/70">No shows occurred on this date in Goose history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Date</th>
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historicalShows.map((show, index) => (
                      <tr
                        key={show.show_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 whitespace-nowrap cursor-pointer relative"
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
                            className="hover:text-white transition-colors table-link"
                          >
                            <span className="font-semibold">{show.formatted_show_date}</span>
                          </button>
                          {hoveredDate === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg min-w-max z-[9999]"
                              style={{
                                left: `${mousePosition.x + 10}px`,
                                top: `${mousePosition.y - 10}px`
                              }}>
                              {show.show_group && <div><strong>{show.show_group}</strong></div>}
                              {show.show_tour && <div>{show.show_tour}</div>}
                              {show.show_detail && <div>{show.show_detail}</div>}
                            </div>
                          )}
                        </td>
                        <td 
                          className="px-4 py-0.5 text-[#fce7ca]/90 relative cursor-pointer"
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
                              className="hover:text-white hover:underline transition-colors"
                            >
                              {show.venue_location}
                            </button>
                            {show.show_group === 'Goose' && (
                              <img src={gooseGif} alt="Goose" className="h-4 w-4 ml-2" />
                            )}
                          </div>
                          {hoveredLocation === show.show_id && (
                            <div className="fixed bg-[#594e5f] text-[#fce7ca] px-3 py-1 rounded shadow-lg whitespace-nowrap z-[9999]"
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
          
          <div className="flex-1">
          {/* 2025 Stats Section */}
          <div className="mb-6 flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-3">
            <h2 className="text-xl font-semibold text-white/90 mb-2">2025 Stats</h2>
            
            <h3 className="text-lg font-semibold text-white/90 mb-3">Top Songs</h3>
            {loadingTopSongs ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading stats...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Song</th>
                      <th className="px-4 py-1 w-[75px] text-center text-s font-semibold text-white/90">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topSongs.map((song, index) => (
                      <tr
                        key={song.song_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td className="px-4 py-0.5 text-[#fce7ca]/90">
                          <button
                            onClick={() => navigate(`/song/${song.song_id}`)}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {song.song}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-center text-[#fce7ca]/90">
                          {song.play_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
            <h3 className="text-lg font-semibold text-white/90 mb-3 mt-6">Top Show Openers</h3>
            {loadingShowOpeners ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading stats...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Song</th>
                      <th className="px-4 py-1 w-[75px] text-center text-s font-semibold text-white/90">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {showOpeners.map((opener, index) => (
                      <tr
                        key={opener.song_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td className="px-4 py-0.5 text-[#fce7ca]/90">
                          <button
                            onClick={() => navigate(`/song/${opener.song_id}`)}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {opener.song_name}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-center text-[#fce7ca]/90">
                          {opener.times_played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
            <h3 className="text-lg font-semibold text-white/90 mb-3 mt-6">Top Set Openers</h3>
            {loadingSetOpeners ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading stats...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Song</th>
                      <th className="px-4 py-1 w-[75px] text-center text-s font-semibold text-white/90">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {setOpeners.map((opener, index) => (
                      <tr
                        key={opener.song_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td className="px-4 py-0.5 text-[#fce7ca]/90">
                          <button
                            onClick={() => navigate(`/song/${opener.song_id}`)}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {opener.song_name}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-center text-[#fce7ca]/90">
                          {opener.times_played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
            <h3 className="text-lg font-semibold text-white/90 mb-3 mt-6">Top Set Closers</h3>
            {loadingSetClosers ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading stats...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Song</th>
                      <th className="px-4 py-1 w-[75px] text-center text-s font-semibold text-white/90">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {setClosers.map((closer, index) => (
                      <tr
                        key={closer.song_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td className="px-4 py-0.5 text-[#fce7ca]/90">
                          <button
                            onClick={() => navigate(`/song/${closer.song_id}`)}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {closer.song_name}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-center text-[#fce7ca]/90">
                          {closer.times_played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          
            <h3 className="text-lg font-semibold text-white/90 mb-3 mt-6">Top Encores</h3>
            {loadingEncores ? (
              <div className="text-center py-12">
                <p className="text-[#fce7ca]/70">Loading stats...</p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0e151b] border-y border-white/10">
                      <th className="px-4 py-1 text-left text-s font-semibold text-white/90">Song</th>
                      <th className="px-4 py-1 w-[75px] text-center text-s font-semibold text-white/90">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {encores.map((encore, index) => (
                      <tr
                        key={encore.song_id}
                        className={`${
                          index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                        } hover:bg-white/10 transition-colors text-xs`}
                      >
                        <td className="px-4 py-0.5 text-[#fce7ca]/90">
                          <button
                            onClick={() => navigate(`/song/${encore.song_id}`)}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {encore.song_name}
                          </button>
                        </td>
                        <td className="px-4 py-0.5 text-center text-[#fce7ca]/90">
                          {encore.times_played}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}