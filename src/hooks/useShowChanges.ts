import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShowChange, SetlistEntry, ShowData } from '../types/showChanges';

export const useShowChanges = (showId: string) => {
    const [changes, setChanges] = useState<ShowChange[]>([]);
    const [setlistUrl, setSetlistUrl] = useState<string | null>(null);
    const [setlistRecordExists, setSetlistRecordExists] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showData, setShowData] = useState<ShowData | null>(null);
    const [setlist, setSetlist] = useState<SetlistEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchShowData() {
            if (!showId) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch setlist record first to determine if component should be shown
                const { data: setlistData, error: setlistError } = await supabase
                    .from('show_setlists')
                    .select('setlist_url')
                    .eq('show_id', showId)
                    .maybeSingle();

                if (setlistError && setlistError.code !== 'PGRST116') {
                    console.error('Supabase error (setlist):', setlistError);
                    // Don't set error state for this - it's optional
                }

                // Check if a setlist record actually exists (not just no error)
                const hasSetlistRecord = setlistData !== null;

                // If no setlist record exists, set loading to false and return early
                if (!hasSetlistRecord) {
                    setSetlistRecordExists(false);
                    setLoading(false);
                    return;
                }

                // Record exists, so continue with other queries
                setSetlistRecordExists(true);
                setSetlistUrl(setlistData.setlist_url || null);

                // Fetch show changes
                const { data: changesData, error: changesError } = await supabase
                    .from('show_changes')
                    .select('*')
                    .eq('show_id', showId)
                    .order('change_order', { ascending: true });

                if (changesError) {
                    console.error('Supabase error (changes):', changesError);
                    setError(`Error loading changes: ${changesError.message}`);
                    // Don't return - continue with other queries
                }

                // Fetch show details
                const { data: showDetails, error: showError } = await supabase
                    .from('shows')
                    .select('show_date, show_subvenue, show_venue_location, show_group')
                    .eq('show_id', showId)
                    .maybeSingle();

                if (showError) {
                    console.error('Supabase error (show):', showError);
                    setError(`Error loading show details: ${showError.message}`);
                }

                // Fetch setlist entries
                const { data: setlistEntries, error: setlistError2 } = await supabase
                    .from('setlist_entries')
                    .select(`
                        entry_id,
                        entry_song,
                        entry_short,
                        entry_segue,
                        entry_placement,
                        entry_setorder,
                        entry_set,
                        entry_setnum,
                        songs (
                            song_id
                        )
                    `)
                    .eq('entry_show', showId)
                    .order('entry_set', { ascending: true })
                    .order('entry_setnum', { ascending: true });

                if (setlistError2) {
                    console.error('Supabase error (setlist entries):', setlistError2);
                    // Don't set error state for this - the modal can work without it
                }

                setChanges(changesData || []);
                setShowData(showDetails || null);
                setSetlist(setlistEntries || []);
            } catch (error) {
                console.error('Error fetching show data:', error);
                setError('Unexpected error occurred while loading show data');
            } finally {
                setLoading(false);
            }
        }

        fetchShowData();
    }, [showId]);

    return {
        changes,
        setlistUrl,
        setlistRecordExists,
        loading,
        showData,
        setlist,
        error
    };
};
