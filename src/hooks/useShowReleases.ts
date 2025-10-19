import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ReleaseShow } from '../types/showTypes';

export const useShowReleases = () => {
    const [showReleases, setShowReleases] = useState<ReleaseShow[]>([]);
    const [loadingReleases, setLoadingReleases] = useState(false);

    const fetchShowReleases = async (showId: string) => {
        try {
            setLoadingReleases(true);
            
            let allReleasesData: ReleaseShow[] = [];
            let page = 0;
            let hasMore = true;
            const pageSize = 1000;
            
            while (hasMore) {
                const { data, error } = await supabase
                    .from('releases_shows')
                    .select(`
                        release_id,
                        release_order,
                        releases (
                            release_displayname,
                            release_service
                        )
                    `)
                    .eq('show_id', showId)
                    .order('release_order', { ascending: true })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allReleasesData = [...allReleasesData, ...data];
                    page++;
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            
            setShowReleases(allReleasesData as ReleaseShow[] || []);
        } catch (error) {
            setShowReleases([]);
        } finally {
            setLoadingReleases(false);
        }
    };

    return {
        showReleases,
        loadingReleases,
        fetchShowReleases
    };
};
