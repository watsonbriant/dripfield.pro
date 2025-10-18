import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export function useShowData(shows: any[]) {
    const { user } = useAuth();
    const [attendedShowIds, setAttendedShowIds] = useState<string[]>([]);
    const [showsWithSetlists, setShowsWithSetlists] = useState<Set<string>>(new Set());
    const [showsWithReleases, setShowsWithReleases] = useState<Set<string>>(new Set());
    const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
    const [showRatings, setShowRatings] = useState<Record<string, number>>({});

    useEffect(() => {
        if (user) {
            fetchAttendedShows();
        } else {
            setAttendedShowIds([]);
        }
    }, [user]);

    useEffect(() => {
        if (shows.length > 0) {
            fetchShowsWithSetlists();
            fetchShowsWithReleases();
            fetchAttendeeCounts();
            fetchShowRatings();
        }
    }, [shows]);

    async function fetchAttendedShows() {
        if (!user) return;
        
        try {
            const { data, error } = await supabase
                .from('user_attended_shows')
                .select('show_id')
                .eq('user_id', user.id);

            if (error) throw error;
            setAttendedShowIds(data.map(item => item.show_id));
        } catch (error) {
            console.error('Error fetching attended shows:', error);
        }
    }

    async function fetchShowsWithSetlists() {
        if (shows.length === 0) return;
        
        try {
            const { data, error } = await supabase
                .from('show_setlists')
                .select('show_id')
                .in('show_id', shows.map(s => s.show_id));
            
            if (error) throw error;
            setShowsWithSetlists(new Set(data?.map(item => item.show_id) || []));
        } catch (error) {
            console.error('Error fetching shows with setlists:', error);
        }
    }

    async function fetchShowsWithReleases() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { count, error: countError } = await supabase
                .from('releases_shows')
                .select('*', { count: 'exact', head: true })
                .in('show_id', showIds);
            
            if (countError) throw countError;
            
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allReleaseShows: any[] = [];
            
            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);
                
                const { data, error } = await supabase
                    .from('releases_shows')
                    .select('show_id')
                    .in('show_id', showIds)
                    .range(start, end);
                
                if (error) throw error;
                if (data) allReleaseShows = [...allReleaseShows, ...data];
            }
            
            setShowsWithReleases(new Set(allReleaseShows.map(item => item.show_id)));
        } catch (error) {
            console.error('Error fetching shows with releases:', error);
        }
    }

    async function fetchAttendeeCounts() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { count, error: countError } = await supabase
                .from('user_attended_shows')
                .select('*', { count: 'exact', head: true })
                .in('show_id', showIds);
            
            if (countError) throw countError;
            
            const batchSize = 1000;
            const totalBatches = Math.ceil((count || 0) / batchSize);
            let allData: any[] = [];
            
            for (let i = 0; i < totalBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (count || 0) - 1);
                
                const { data, error } = await supabase
                    .from('user_attended_shows')
                    .select('show_id')
                    .in('show_id', showIds)
                    .range(start, end);
                
                if (error) throw error;
                if (data) allData = [...allData, ...data];
            }
            
            const counts: Record<string, number> = {};
            shows.forEach(show => {
                counts[show.show_id] = 0;
            });
            
            allData.forEach(record => {
                counts[record.show_id] = (counts[record.show_id] || 0) + 1;
            });
            
            setAttendeeCounts(counts);
        } catch (error) {
            console.error('Error fetching attendee counts:', error);
        }
    }

    async function fetchShowRatings() {
        if (shows.length === 0) return;
        
        try {
            const showIds = shows.map(s => s.show_id);
            
            const { data, error } = await supabase
                .from('show_ratings')
                .select('show_id, rating')
                .in('show_id', showIds);
            
            if (error) throw error;
            
            const ratings: Record<string, number> = {};
            shows.forEach(show => {
                const showRatingsData = data?.filter(r => r.show_id === show.show_id) || [];
                if (showRatingsData.length > 0) {
                    const average = showRatingsData.reduce((sum, r) => sum + r.rating, 0) / showRatingsData.length;
                    ratings[show.show_id] = Math.round(average * 100) / 100;
                } else {
                    ratings[show.show_id] = 0;
                }
            });
            
            setShowRatings(ratings);
        } catch (error) {
            console.error('Error fetching show ratings:', error);
        }
    }

    return {
        attendedShowIds,
        showsWithSetlists,
        showsWithReleases,
        attendeeCounts,
        showRatings
    };
}

export function useCategoryArtwork(shows: any[]) {
    const [categoryArtwork, setCategoryArtwork] = useState<Record<string, string>>({});

    useEffect(() => {
        if (shows.length > 0) {
            fetchCategoryArtwork();
        }
    }, [shows]);

    async function fetchCategoryArtwork() {
        try {
            // Get unique categories from shows
            const uniqueCategories = [...new Set(shows.map(s => s.show_listcategorycomplete))];
            
            // Fetch category artwork for all unique categories
            const { data, error } = await supabase
                .from('categories')
                .select('category, category_artwork')
                .in('category', uniqueCategories);
            
            if (error) throw error;
            
            // Create a map of category to artwork URL
            const artworkMap: Record<string, string> = {};
            data?.forEach(cat => {
                artworkMap[cat.category] = cat.category_artwork;
            });
            
            setCategoryArtwork(artworkMap);
        } catch (error) {
            console.error('Error fetching category artwork:', error);
        }
    }

    return categoryArtwork;
}

export function useMobileDetection() {
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
}
