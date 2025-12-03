import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TopSong, ShowOpener, SetOpener, SetCloser, Encore, NotPlayedSong, LongestSong, LiberatedSong, ShowStat } from '../types/home';
import {
  fetchTopSongsData,
  fetchShowOpenersData,
  fetchSetOpenersData,
  fetchSetClosersData,
  fetchEncoresData,
  fetchLongestSongsData,
  fetchLiberatedSongsData
} from '../utils/statsDataUtils';
import { fetchShowStatsData } from '../utils/showStatsUtils';

export const useStatsData = (selectedYear: number | string) => {
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [showOpeners, setShowOpeners] = useState<ShowOpener[]>([]);
  const [setOpeners, setSetOpeners] = useState<SetOpener[]>([]);
  const [setClosers, setSetClosers] = useState<SetCloser[]>([]);
  const [encores, setEncores] = useState<Encore[]>([]);
  const [notPlayedSongs, setNotPlayedSongs] = useState<NotPlayedSong[]>([]);
  const [longestSongs, setLongestSongs] = useState<LongestSong[]>([]);
  const [liberatedSongs, setLiberatedSongs] = useState<LiberatedSong[]>([]);
  const [longestShows, setLongestShows] = useState<ShowStat[]>([]);
  const [lowestRarityShows, setLowestRarityShows] = useState<ShowStat[]>([]);
  const [highestGapShows, setHighestGapShows] = useState<ShowStat[]>([]);
  const [highestAttendedShows, setHighestAttendedShows] = useState<ShowStat[]>([]);
  const [highestRatedShows, setHighestRatedShows] = useState<ShowStat[]>([]);
  
  const [loadingTopSongs, setLoadingTopSongs] = useState(true);
  const [loadingShowOpeners, setLoadingShowOpeners] = useState(true);
  const [loadingSetOpeners, setLoadingSetOpeners] = useState(true);
  const [loadingSetClosers, setLoadingSetClosers] = useState(true);
  const [loadingEncores, setLoadingEncores] = useState(true);
  const [loadingNotPlayed, setLoadingNotPlayed] = useState(true);
  const [loadingLongestSongs, setLoadingLongestSongs] = useState(true);
  const [loadingLiberatedSongs, setLoadingLiberatedSongs] = useState(true);
  const [loadingShowStats, setLoadingShowStats] = useState(true);

  const fetchTopSongs = async () => {
    try {
      const data = await fetchTopSongsData(selectedYear);
      setTopSongs(data);
    } catch (error) {
      console.error('Error fetching top songs:', error);
    } finally {
      setLoadingTopSongs(false);
    }
  };

  const fetchShowOpeners = async () => {
    try {
      const data = await fetchShowOpenersData(selectedYear);
      setShowOpeners(data);
    } catch (error) {
      console.error('Error fetching show openers:', error);
    } finally {
      setLoadingShowOpeners(false);
    }
  };

  const fetchSetOpeners = async () => {
    try {
      const data = await fetchSetOpenersData(selectedYear);
      setSetOpeners(data);
    } catch (error) {
      console.error('Error fetching set openers:', error);
    } finally {
      setLoadingSetOpeners(false);
    }
  };

  const fetchSetClosers = async () => {
    try {
      const data = await fetchSetClosersData(selectedYear);
      setSetClosers(data);
    } catch (error) {
      console.error('Error fetching set closers:', error);
    } finally {
      setLoadingSetClosers(false);
    }
  };

  const fetchEncores = async () => {
    try {
      const data = await fetchEncoresData(selectedYear);
      setEncores(data);
    } catch (error) {
      console.error('Error fetching encores:', error);
    } finally {
      setLoadingEncores(false);
    }
  };

  const fetchNotPlayedSongs = async () => {
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
  
      setNotPlayedSongs((data || []).slice(0, 10));
    } catch (error) {
      console.error('Error fetching not played songs:', error);
    } finally {
      setLoadingNotPlayed(false);
    }
  };

  const fetchLongestSongs = async () => {
    try {
      const data = await fetchLongestSongsData(selectedYear);
      setLongestSongs(data);
    } catch (error) {
      console.error('Error fetching longest songs:', error);
    } finally {
      setLoadingLongestSongs(false);
    }
  };

  const fetchLiberatedSongs = async () => {
    try {
      const data = await fetchLiberatedSongsData(selectedYear);
      setLiberatedSongs(data);
    } catch (error) {
      console.error('Error fetching liberated songs:', error);
    } finally {
      setLoadingLiberatedSongs(false);
    }
  };

  const fetchShowStats = async () => {
    if (selectedYear !== 2025) {
      setLongestShows([]);
      setLowestRarityShows([]);
      setHighestGapShows([]);
      setHighestAttendedShows([]);
      setHighestRatedShows([]);
      setLoadingShowStats(false);
      return;
    }

    try {
      const stats = await fetchShowStatsData();
      setLongestShows(stats.longest);
      setLowestRarityShows(stats.lowestRarity);
      setHighestGapShows(stats.highestGap);
      setHighestAttendedShows(stats.highestAttended);
      setHighestRatedShows(stats.highestRated);
    } catch (error) {
      console.error('Error fetching show stats:', error);
    } finally {
      setLoadingShowStats(false);
    }
  };

  useEffect(() => {
    setLoadingTopSongs(true);
    setLoadingShowOpeners(true);
    setLoadingSetOpeners(true);
    setLoadingSetClosers(true);
    setLoadingEncores(true);
    if (selectedYear !== 'all-time') {
      setLoadingNotPlayed(true);
    }
    setLoadingLongestSongs(true);
    setLoadingLiberatedSongs(true);
    setLoadingShowStats(true);

    fetchTopSongs();
    fetchShowOpeners();
    fetchSetOpeners();
    fetchSetClosers();
    fetchEncores();
    fetchNotPlayedSongs();
    fetchLongestSongs();
    fetchLiberatedSongs();
    fetchShowStats();
  }, [selectedYear]);

  const isAnyStatLoading = loadingTopSongs || loadingShowOpeners || loadingSetOpeners || loadingSetClosers || loadingEncores || loadingNotPlayed || loadingLongestSongs || loadingLiberatedSongs || loadingShowStats;

  return {
    topSongs,
    showOpeners,
    setOpeners,
    setClosers,
    encores,
    notPlayedSongs,
    longestSongs,
    liberatedSongs,
    longestShows,
    lowestRarityShows,
    highestGapShows,
    highestAttendedShows,
    highestRatedShows,
    isAnyStatLoading
  };
};
