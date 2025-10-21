import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface GameShow {
    show_id: string;
    show_date: string;
    show_subvenue: string;
    show_venue_location: string;
    show_time: string;
    show_tour: string;
    show_canonid: string;
    show_subvenue_venue: string;
    show_detail?: string | null;
    show_scored?: boolean;
    playerCount?: number;
    highScore?: number;
    averageScore?: number;
    averageOverUnder?: number;
    totalCorrectSongs?: number;
    averageCorrectSongs?: number;
    totalCorrectSets?: number;
    averageCorrectSets?: number;
    usersPickedOpener?: number;
    usersPickedCloser?: number;
}

export interface PlayerStats {
    username: string;
    userId: string;
    totalPoints: number;
    showsPlayed: number;
    songsPicked: number;
    setsPicked: number;
    showOpenersPicked: number;
    showClosersPicked: number;
    avgPointsPerShow: number;
}

export interface TourInfo {
    tour: string;
    tour_id: string;
    tour_canonid?: number;
}

export interface TourStats {
    totalShows: number;
    totalPlayers: number;
    tourWinners: { username: string, score: number }[];
}

export function useTourDetails(tourId: string | undefined) {
    const [loading, setLoading] = useState(true);
    const [gameShows, setGameShows] = useState<GameShow[]>([]);
    const [tourInfo, setTourInfo] = useState<TourInfo | null>(null);
    const [tourStats, setTourStats] = useState<TourStats>({
        totalShows: 0,
        totalPlayers: 0,
        tourWinners: []
    });
    const [standings, setStandings] = useState<PlayerStats[]>([]);

    // Fetch tour info first
    useEffect(() => {
        async function fetchTourInfo() {
            if (!tourId) return;

            try {
                const { data, error } = await supabase
                    .from('tours')
                    .select('tour, tour_id, tour_canonid')
                    .eq('tour_id', tourId)
                    .single();

                if (error) {
                    console.error('Error fetching tour info:', error);
                    return;
                }

                setTourInfo(data);
            } catch (error) {
                console.error('Error in tour info fetch:', error);
            }
        }

        fetchTourInfo();
    }, [tourId]);

    // Fetch all tour shows using the proven logic from useShowStatistics
    const fetchTourShows = useCallback(async () => {
        if (!tourInfo) return;

        try {
            setLoading(true);

            // Get all shows for this tour
            const { data, error } = await supabase
                .from('shows')
                .select('show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_scored, show_detail, show_canonid, show_subvenue_venue')
                .eq('show_tour', tourInfo.tour)
                .eq('show_issetlistgame', true)
                .order('show_canonid', { ascending: true });

            if (error) {
                console.error('Error fetching tour shows:', error);
                return;
            }

            // Process shows with statistics using the same logic as useShowStatistics
            const processedShows = [...data];

            for (const show of processedShows) {
                try {
                    // Get player count
                    const { count, error } = await supabase
                        .from('setlist_game_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('show_id', show.show_id);

                    if (error) {
                        console.error(`Error fetching player count for show ${show.show_id}:`, error);
                        show.playerCount = 0;
                    } else {
                        show.playerCount = count || 0;
                    }

                    // Get submissions data for this show
                    const { data: submissions, error: subError } = await supabase
                        .from('setlist_game_submissions')
                        .select('submission_id, score, total_songs_picked, total_songs_played')
                        .eq('show_id', show.show_id);

                    if (subError) {
                        console.error(`Error fetching submissions for show ${show.show_id}:`, subError);
                    } else if (submissions && submissions.length > 0) {
                        // Calculate high score
                        show.highScore = Math.max(...submissions.map(s => s.score || 0));
                        
                        // Calculate average score
                        const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
                        show.averageScore = Number((totalScore / submissions.length).toFixed(2));
                        
                        // Calculate average over/under picks
                        const overUnders = submissions.map(s => {
                            const songsPlayed = s.total_songs_played || 0;
                            const songsPicked = s.total_songs_picked || 0;
                            return songsPicked - songsPlayed;
                        });
                        const totalOverUnder = overUnders.reduce((sum, val) => sum + val, 0);
                        show.averageOverUnder = Number((totalOverUnder / submissions.length).toFixed(2));
                        
                        // Get picks data for this show
                        const submissionIds = submissions.map(s => s.submission_id);
                        const { data: picks, error: picksError } = await supabase
                            .from('setlist_game_picks')
                            .select('submission_id, result, showopener_correct, showcloser_correct')
                            .in('submission_id', submissionIds);
                            
                        if (picksError) {
                            console.error(`Error fetching picks for show ${show.show_id}:`, picksError);
                        } else if (picks && picks.length > 0) {
                            // Count total correct songs
                            const correctSongs = picks.filter(p => p.result !== 'not_played').length;
                            show.totalCorrectSongs = correctSongs;
                            
                            // Calculate average correct songs per user
                            const submissionPicks: Record<string, any> = {};
                            picks.forEach(pick => {
                                if (!submissionPicks[pick.submission_id]) {
                                    submissionPicks[pick.submission_id] = {
                                        correctSongs: 0,
                                        correctSets: 0,
                                        pickedOpener: false,
                                        pickedCloser: false
                                    };
                                }
                                
                                if (pick.result !== 'not_played') {
                                    submissionPicks[pick.submission_id].correctSongs++;
                                }
                                
                                if (['correct_song_set', 'correct_song_set_setnum', 'correct_song_set_openercloserencore', 'correct_song_set_setnum_openercloserencore'].includes(pick.result)) {
                                    submissionPicks[pick.submission_id].correctSets++;
                                }
                                
                                if (pick.showopener_correct) {
                                    submissionPicks[pick.submission_id].pickedOpener = true;
                                }
                                
                                if (pick.showcloser_correct) {
                                    submissionPicks[pick.submission_id].pickedCloser = true;
                                }
                            });
                            
                            // Calculate total correct sets
                            const correctSets = picks.filter(p => 
                                ['correct_song_set', 'correct_song_set_setnum', 'correct_song_set_openercloserencore', 'correct_song_set_setnum_openercloserencore'].includes(p.result)
                            ).length;
                            show.totalCorrectSets = correctSets;
                            
                            // Count users who picked opener and closer correctly
                            show.usersPickedOpener = Object.values(submissionPicks).filter((p: any) => p.pickedOpener).length;
                            show.usersPickedCloser = Object.values(submissionPicks).filter((p: any) => p.pickedCloser).length;
                            
                            // Calculate averages per user
                            const submissionValues = Object.values(submissionPicks);
                            if (submissionValues.length > 0) {
                                const totalCorrectSongs = submissionValues.reduce((sum, val: any) => sum + val.correctSongs, 0);
                                const totalCorrectSets = submissionValues.reduce((sum, val: any) => sum + val.correctSets, 0);
                                
                                show.averageCorrectSongs = Number((totalCorrectSongs / submissionValues.length).toFixed(2));
                                show.averageCorrectSets = Number((totalCorrectSets / submissionValues.length).toFixed(2));
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Exception processing data for show ${show.show_id}:`, error);
                }
            }

            setGameShows(processedShows);

            // Set tour stats
            setTourStats(prev => ({
                ...prev,
                totalShows: processedShows.length
            }));
        } catch (error) {
            console.error('Error in tour shows fetch:', error);
        } finally {
            setLoading(false);
        }
    }, [tourInfo]);

    // Fetch tour statistics and standings
    const fetchTourStats = useCallback(async () => {
        if (!tourInfo) return;

        try {
            // Get all scored shows for this tour
            const { data: showData, error: showError } = await supabase
                .from('shows')
                .select('show_id')
                .eq('show_tour', tourInfo.tour)
                .eq('show_scored', true)
                .eq('show_issetlistgame', true);

            if (showError) {
                console.error('Error fetching scored shows:', showError);
                return;
            }

            if (!showData || showData.length === 0) {
                setStandings([]);
                return;
            }

            const showIds = showData.map(show => show.show_id);

            // Get all submissions for these shows
            const { data: submissionsData, error: submissionsError } = await supabase
                .from('setlist_game_submissions')
                .select('submission_id, user_id, show_id, score, total_songs_picked, total_songs_played')
                .in('show_id', showIds);

            if (submissionsError) {
                console.error('Error fetching submissions:', submissionsError);
                return;
            }

            if (!submissionsData || submissionsData.length === 0) {
                setStandings([]);
                return;
            }

            // Count unique players
            const uniquePlayers = [...new Set(submissionsData.map(sub => sub.user_id))];
            setTourStats(prev => ({
                ...prev,
                totalPlayers: uniquePlayers.length
            }));

            // Get unique user IDs from submissions
            const userIds = uniquePlayers;

            // Fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                // Continue without usernames if profiles fetch fails
            }

            // Create mapping of user_id to username
            const usernameMap: Record<string, string> = {};
            profilesData?.forEach(profile => {
                usernameMap[profile.id] = profile.username;
            });

            // Fetch detailed pick data
            const submissionIds = submissionsData.map(sub => sub.submission_id);

            const { data: picksData, error: picksError } = await supabase
                .from('setlist_game_picks')
                .select('submission_id, result, set, placement, showopener_correct, showcloser_correct')
                .in('submission_id', submissionIds)
                .neq('result', 'not_played');

            if (picksError) {
                console.error('Error fetching picks:', picksError);
                // Continue with partial data
            }

            // Group submissions by user and calculate stats
            const userStats: Record<string, {
                totalPoints: number,
                showsPlayed: number,
                songsPicked: number,
                setsPicked: number,
                showOpenersPicked: number,
                showClosersPicked: number
            }> = {};

            // Initialize stats for each user
            userIds.forEach(userId => {
                userStats[userId] = {
                    totalPoints: 0,
                    showsPlayed: 0,
                    songsPicked: 0,
                    setsPicked: 0,
                    showOpenersPicked: 0,
                    showClosersPicked: 0
                };
            });

            // Calculate basic stats
            submissionsData.forEach(submission => {
                const userId = submission.user_id;

                userStats[userId].totalPoints += submission.score || 0;
                userStats[userId].showsPlayed += 1;
            });

            // Count detailed picks stats
            picksData?.forEach(pick => {
                const submission = submissionsData.find(s => s.submission_id === pick.submission_id);
                if (!submission) return;

                const userId = submission.user_id;

                // Count songs picked correctly
                if (pick.result !== 'not_played') {
                    userStats[userId].songsPicked += 1;
                }

                // Count sets picked correctly
                if (pick.result === 'correct_song_set' ||
                    pick.result === 'correct_song_set_setnum' ||
                    pick.result === 'correct_song_set_openercloserencore' ||
                    pick.result === 'correct_song_set_setnum_openercloserencore') {
                    userStats[userId].setsPicked += 1;
                }

                // Count show openers and closers
                if (pick.showopener_correct === true) {
                    userStats[userId].showOpenersPicked += 1;
                }

                if (pick.showcloser_correct === true) {
                    userStats[userId].showClosersPicked += 1;
                }
            });

            // Create standings array
            const standingsArray: PlayerStats[] = userIds.map(userId => {
                const username = usernameMap[userId] || userId.substring(0, 8);
                const stats = userStats[userId];

                return {
                    username: username.split('@')[0], // Only use characters before @ symbol
                    userId,
                    totalPoints: stats.totalPoints,
                    showsPlayed: stats.showsPlayed,
                    songsPicked: stats.songsPicked,
                    setsPicked: stats.setsPicked,
                    showOpenersPicked: stats.showOpenersPicked,
                    showClosersPicked: stats.showClosersPicked,
                    avgPointsPerShow: stats.showsPlayed > 0 ? Number((stats.totalPoints / stats.showsPlayed).toFixed(2)) : 0
                };
            });

            // Sort standings by total points descending
            const sortedStandings = [...standingsArray].sort((a, b) => {
                // Primary sort by total points
                if (a.totalPoints !== b.totalPoints) {
                    return b.totalPoints - a.totalPoints;
                }

                // Tiebreaker: average points per show
                if (a.avgPointsPerShow !== b.avgPointsPerShow) {
                    return b.avgPointsPerShow - a.avgPointsPerShow;
                }

                // Tiebreaker: songs picked
                if (a.songsPicked !== b.songsPicked) {
                    return b.songsPicked - a.songsPicked;
                }

                // Last tiebreaker: alphabetical by username
                return a.username.localeCompare(b.username);
            });

            setStandings(sortedStandings);

            // Set tour winners
            if (sortedStandings.length > 0) {
                const highestScore = sortedStandings[0].totalPoints;
                const winners = sortedStandings
                    .filter(player => player.totalPoints === highestScore)
                    .map(player => ({
                        username: player.username,
                        score: player.totalPoints
                    }));

                setTourStats(prev => ({
                    ...prev,
                    tourWinners: winners
                }));
            }

        } catch (error) {
            console.error('Error fetching tour stats:', error);
        }
    }, [tourInfo]);

    // Initial data fetching
    useEffect(() => {
        if (tourInfo) {
            fetchTourShows();
            fetchTourStats();
        }
    }, [tourInfo, fetchTourShows, fetchTourStats]);

    return {
        loading,
        gameShows,
        tourInfo,
        tourStats,
        standings
    };
}
