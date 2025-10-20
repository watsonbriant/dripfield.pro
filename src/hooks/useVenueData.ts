import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface VenueData {
    venue: string;
    venue_location: string;
    venue_coachnotes: string | null;
    venue_global: boolean;
    venue_address: string | null;
    venue_latitude: string | null;
    venue_longitude: string | null;
}

export const useVenueData = () => {
    const [allVenues, setAllVenues] = useState<VenueData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const mountedRef = useRef(false);

    const fetchAllVenues = async () => {
        try {
            setLoading(true);
            setLoadingProgress(5);
            
            let allVenuesData: VenueData[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('venues')
                    .select('*')
                    .order('venue', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    allVenuesData = [...allVenuesData, ...data];
                    page++;
                    setLoadingProgress(Math.min(95, 5 + (page * 15)));
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setAllVenues(allVenuesData || []);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (error) {
            console.error('Error fetching venues:', error);
            setLoadingProgress(100);
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
            }, 300);
        }
    };

    useEffect(() => {
        if (!mountedRef.current) {
            fetchAllVenues();
            mountedRef.current = true;
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchAllVenues();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return {
        allVenues,
        loading,
        loadingProgress,
        fetchAllVenues
    };
};
