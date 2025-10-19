import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
    ShowData, GroupData, TourData, SubvenueData, YearData, SongData, ReleaseShow 
} from '../types/showTypes';

export const useShowData = () => {
    const [allShows, setAllShows] = useState<ShowData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [tours, setTours] = useState<TourData[]>([]);
    const [subvenues, setSubvenues] = useState<SubvenueData[]>([]);
    const [years, setYears] = useState<YearData[]>([]);
    const [songs, setSongs] = useState<SongData[]>([]);
    const mountedRef = useRef(false);

    const fetchAllShows = async () => {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            let allShowsData: ShowData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('shows')
                    .select('*')
                    .order('show_date', { ascending: false })
                    .order('show_canonid', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allShowsData = [...allShowsData, ...data];
                    page++;
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllShows(allShowsData || []);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    };

    const fetchReferenceData = async () => {
        try {
            // Fetch groups
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('group')
                .order('group', { ascending: true });
            if (groupsError) throw groupsError;
            setGroups(groupsData || []);

            // Fetch tours
            const { data: toursData, error: toursError } = await supabase
                .from('tours')
                .select('tour, tour_canonid')
                .order('tour_canonid', { ascending: true });
            if (toursError) throw toursError;
            setTours(toursData || []);

            // Fetch subvenues
            const { data: subvenuesData, error: subvenuesError } = await supabase
                .from('subvenues')
                .select('subvenue, subvenue_venue_location')
                .order('subvenue', { ascending: true });
            if (subvenuesError) throw subvenuesError;
            setSubvenues(subvenuesData || []);

            // Fetch years
            const { data: yearsData, error: yearsError } = await supabase
                .from('years')
                .select('year')
                .order('year', { ascending: true });
            if (yearsError) throw yearsError;
            setYears(yearsData || []);

            // Fetch songs
            let allSongsData: SongData[] = [];
            let songPage = 0;
            let hasMoreSongs = true;
            const songPageSize = 1000;

            while (hasMoreSongs) {
                const { data: songsData, error: songsError } = await supabase
                    .from('songs')
                    .select('song, song_id')
                    .order('song', { ascending: true })
                    .range(songPage * songPageSize, (songPage + 1) * songPageSize - 1);
                
                if (songsError) throw songsError;
                
                if (songsData && songsData.length > 0) {
                    allSongsData = [...allSongsData, ...songsData];
                    songPage++;
                    hasMoreSongs = songsData.length === songPageSize;
                } else {
                    hasMoreSongs = false;
                }
            }
            setSongs(allSongsData || []);
        } catch (error) {
            // Handle error silently
        }
    };

    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllShows();
            fetchReferenceData();
            mountedRef.current = true;
        }
    }, []);

    // Handle visibility change to reload data when returning to this tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchAllShows();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return {
        allShows,
        loading,
        loadingProgress,
        groups,
        tours,
        subvenues,
        years,
        songs,
        fetchAllShows
    };
};
