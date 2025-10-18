import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShowTable } from './shared/ShowTableComponents';
import { useShowData } from './shared/ShowDataHooks';

interface ShowWithDripfield {
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
    show_rarity: string | null;
    show_gap: string | null;
    show_dripfieldcomplete: boolean;
}

interface DripfieldCompleteShowsListProps {
    onProgressUpdate: (progress: number) => void;
}

export function DripfieldCompleteShowsList({ onProgressUpdate }: DripfieldCompleteShowsListProps) {
    const [shows, setShows] = useState<ShowWithDripfield[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        attendedShowIds,
        showsWithSetlists,
        showsWithReleases,
        attendeeCounts,
        showRatings
    } = useShowData(shows);

    useEffect(() => {
        fetchShows();
    }, []);

    async function fetchShows() {
        try {
            onProgressUpdate(5);
            
            // Get count of shows with dripfield complete = true
            const { count: showCount, error: countError } = await supabase
                .from('shows')
                .select('*', { count: 'exact', head: true })
                .eq('show_dripfieldcomplete', true);

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
                        show_length,
                        show_rarity,
                        show_gap,
                        show_dripfieldcomplete,
                        subvenues:show_subvenue(
                            venues:subvenue_venue(
                                venue_id
                            )
                        ),
                        tours:show_tour(
                            tour_id
                        )
                    `)
                    .eq('show_dripfieldcomplete', true)
                    .order('show_date', { ascending: true })
                    .range(start, end);

                if (showsError) throw showsError;
                if (showsBatch) allShows = [...allShows, ...showsBatch];
            }

            onProgressUpdate(95);

            // Format shows data
            const formattedShows = allShows.map(show => ({
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
                show_length: show.show_length || '-',
                show_rarity: show.show_rarity !== null && show.show_rarity !== undefined
                    ? `${show.show_rarity.toFixed(2)}%`
                    : null,
                show_gap: show.show_gap !== null && show.show_gap !== undefined
                    ? show.show_gap.toFixed(2)
                    : null,
                show_dripfieldcomplete: show.show_dripfieldcomplete
            }));

            setShows(formattedShows);
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

    return (
        <ShowTable
            shows={shows}
            attendedShowIds={attendedShowIds}
            showsWithSetlists={showsWithSetlists}
            showsWithReleases={showsWithReleases}
            attendeeCounts={attendeeCounts}
            showRatings={showRatings}
            showCategoryColumn={false}
            showRanking={false}
        />
    );
}