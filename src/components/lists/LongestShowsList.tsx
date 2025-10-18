import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShowTable } from './shared/ShowTableComponents';
import { useShowData, useMobileDetection } from './shared/ShowDataHooks';

interface ShowWithLength {
    show_id: string;
    show_date: string;
    show_group: string;
    show_tour: string;
    tour_id: string;
    show_subvenue: string;
    show_venue_location: string;
    show_detail: string | null;
    show_alert: string | null;
    show_wl_link: string | null;
    venue_id: string;
    show_length: string;
    total_seconds: number;
    show_rarity: string | null;
    show_gap: string | null;
}

interface LongestShowsListProps {
    onProgressUpdate: (progress: number) => void;
}

export function LongestShowsList({ onProgressUpdate }: LongestShowsListProps) {
    const [shows, setShows] = useState<ShowWithLength[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        attendedShowIds,
        showsWithSetlists,
        showsWithReleases,
        attendeeCounts,
        showRatings
    } = useShowData(shows);

    const isMobile = useMobileDetection();

    useEffect(() => {
        fetchShows();
    }, []);

    async function fetchShows() {
        try {
            onProgressUpdate(5);
            
            // Get all canonical shows with show_length, show_rarity, and show_gap
            const { count: showCount, error: countError } = await supabase
                .from('shows')
                .select('*', { count: 'exact', head: true })
                .not('show_canonid', 'is', null)
                .not('show_length', 'is', null);

            if (countError) throw countError;

            const batchSize = 1000;
            const totalShowBatches = Math.ceil((showCount || 0) / batchSize);
            let allShows: any[] = [];

            for (let i = 0; i < totalShowBatches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize - 1, (showCount || 0) - 1);

                const batchProgress = 5 + ((i + 1) / totalShowBatches) * 90;
                onProgressUpdate(Math.round(batchProgress));

                const { data: showsBatch, error: showsError } = await supabase
                    .from('shows')
                    .select(`
                        show_id,
                        show_date,
                        show_group,
                        show_tour,
                        show_subvenue,
                        show_venue_location,
                        show_detail,
                        show_alert,
                        show_wl_link,
                        show_canonid,
                        show_length,
                        show_rarity,
                        show_gap,
                        subvenues:show_subvenue(
                            venues:subvenue_venue(
                                venue_id
                            )
                        ),
                        tours:show_tour(
                            tour_id
                        )
                    `)
                    .not('show_canonid', 'is', null)
                    .not('show_length', 'is', null)
                    .range(start, end);

                if (showsError) throw showsError;
                if (showsBatch) allShows = [...allShows, ...showsBatch];
            }

            onProgressUpdate(95);

            // Convert show_length to seconds and format rarity/gap
            const timeToSeconds = (timeStr: string) => {
                const parts = timeStr.split(':').map(Number);
                if (parts.length === 3) {
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                    return parts[0] * 60 + parts[1];
                }
                return 0;
            };

            const showsWithSeconds = allShows
                .filter(show => show.show_length && show.show_canonid)
                .map(show => ({
                    show_id: show.show_id,
                    show_date: show.show_date,
                    show_group: show.show_group,
                    show_tour: show.show_tour,
                    tour_id: show.tours?.tour_id,
                    show_subvenue: show.show_subvenue,
                    show_venue_location: show.show_venue_location,
                    show_detail: show.show_detail,
                    show_alert: show.show_alert,
                    show_wl_link: show.show_wl_link,
                    venue_id: show.subvenues?.venues?.venue_id,
                    show_length: show.show_length,
                    total_seconds: timeToSeconds(show.show_length),
                    // Format rarity with % symbol if it exists
                    show_rarity: show.show_rarity !== null && show.show_rarity !== undefined
                        ? `${show.show_rarity.toFixed(2)}%`
                        : null,
                    // Format gap as string with 2 decimal places if it exists
                    show_gap: show.show_gap !== null && show.show_gap !== undefined
                        ? show.show_gap.toFixed(2)
                        : null
                }));

            // Sort and get top 25 (longest shows)
            showsWithSeconds.sort((a, b) => b.total_seconds - a.total_seconds);

            const top25 = showsWithSeconds.slice(0, 25);

            setShows(top25);
            onProgressUpdate(100);
        } catch (error) {
            console.error('Error fetching shows:', error);
            onProgressUpdate(100);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading shows...</div>
        );
    }

    if (shows.length === 0) {
        return (
            <div className="text-fifth text-center py-8">No shows found</div>
        );
    }

    // Calculate rankings with tie handling
    let currentRank = 1;
    let currentBgGroup = 0;
    const rankedShows = shows.map((show, index) => {
        let displayRank: number | null = null;
        
        // Show rank if it's the first show or if the length is different from previous
        if (index === 0 || shows[index - 1].total_seconds !== show.total_seconds) {
            displayRank = currentRank;
            currentBgGroup++; // Change background group when rank changes
        }
        
        currentRank++;
        
        return { ...show, displayRank, bgGroup: currentBgGroup };
    });

    return (
        <ShowTable
            shows={rankedShows}
            attendedShowIds={attendedShowIds}
            showsWithSetlists={showsWithSetlists}
            showsWithReleases={showsWithReleases}
            attendeeCounts={attendeeCounts}
            showRatings={showRatings}
            isMobile={isMobile}
            showCategoryColumn={false}
            showRanking={true}
        />
    );
}