import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface SubvenueData {
    subvenue: string;
    subvenue_venue: string;
    subvenue_startdate: string | null;
    subvenue_enddate: string | null;
}

export interface VenueData {
    venue: string;
    venue_location: string;
}

export const useSubvenueData = () => {
    const [allSubvenues, setAllSubvenues] = useState<SubvenueData[]>([]);
    const [allVenues, setAllVenues] = useState<VenueData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const mountedRef = useRef(false);

    const fetchAllSubvenues = async () => {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            let allSubvenuesData: SubvenueData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('subvenues')
                    .select('*')
                    .order('subvenue', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allSubvenuesData = [...allSubvenuesData, ...data];
                    page++;
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllSubvenues(allSubvenuesData || []);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            console.error('Error fetching subvenues:', error);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    };

    const fetchAllVenues = async () => {
        try {
            const { data, error } = await supabase
                .from('venues')
                .select('venue, venue_location')
                .order('venue', { ascending: true });
            
            if (error) throw error;
            setAllVenues(data || []);
        } catch (error) {
            console.error('Error fetching venues:', error);
        }
    };

    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllSubvenues();
            fetchAllVenues();
            mountedRef.current = true;
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchAllSubvenues();
                fetchAllVenues();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return {
        allSubvenues,
        allVenues,
        loading,
        loadingProgress,
        fetchAllSubvenues,
        fetchAllVenues
    };
};
