import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, ListMusic, Trophy } from 'lucide-react';

interface GameShow {
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

interface PlayerStats {
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

interface TourInfo {
    tour: string;
    tour_id: string;
    tour_canonid?: number;
}

export function TourDetailsPage() {
    const { tourId } = useParams<{ tourId: string }>();
    const [loading, setLoading] = useState(true);
    const [gameShows, setGameShows] = useState<GameShow[]>([]);
    const [tourInfo, setTourInfo] = useState<TourInfo | null>(null);
    const [tourStats, setTourStats] = useState({
        totalShows: 0,
        totalPlayers: 0,
        tourWinners: [] as { username: string, score: number }[]
    });
    const [standings, setStandings] = useState<PlayerStats[]>([]);
    const { user } = useAuth();

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

    // Fetch all tour shows
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

            // Get player counts for each show
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

    // Format date for display (MM.DD.YY)
    const formatDate = (dateString: string) => {
        return dateString
            .split('-')
            .slice(1)
            .concat(dateString.substring(2, 4))
            .join('.');
    };

    return (
        <div className="max-w-[1280px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center mb-6 font-semibold text-sm text-fifth">
                <Link to="/setlistgame" className="hover:underline transition-colors">
                    <div className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-secondary text-fifth">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Echo of a Show
                    </div>
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-fifth bg-canvas rounded-lg py-1 px-2 border border-secondary">
                    {tourInfo?.tour || 'Tour Details'}
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-fifth mt-4">Loading tour details...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Tour Info Card */}
                    <div className="bg-primary border border-secondary rounded-lg p-3">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div>
                                <h1 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">{tourInfo?.tour}</h1>
                                <div className="flex gap-3">
                                    <div className="flex items-center">
                                        <span className="text-fifth font-light text-sm">Shows:</span>
                                        <span className="ml-1 mr-1 text-sm font-medium text-fifth">{tourStats.totalShows}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-fifth font-light text-sm">Players:</span>
                                        <span className="ml-1 text-sm font-medium text-fifth">{tourStats.totalPlayers}</span>
                                    </div>
                                </div>
                            </div>

                            {tourStats.tourWinners.length > 0 && (
                                <div className="mt-4 md:mt-0">
                                    <div className="bg-tertiary/40 rounded-md p-3 border border-tertiary">
                                        <div className="flex items-center">
                                            <Trophy className="w-5 h-5 text-fifth mr-2" />
                                            <span className="font-semibold text-fifth mr-2">Tour Champion{tourStats.tourWinners.length > 1 ? 's' : ''}: </span>
                                            <div className="ml-1 flex flex-wrap">
                                                {tourStats.tourWinners.map((winner, idx) => (
                                                    <span key={idx} className="text-fourth font-semibold">
                                                        {winner.username}
                                                        {idx < tourStats.tourWinners.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tour Shows Table - rest of the component remains the same */}
                    <div className="bg-primary border border-secondary rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
                                <ListMusic className="w-5 h-5 mr-2" />
                                <span>Shows</span>
                            </h2>
                        </div>

                        {gameShows.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-fifth">No shows found for this tour.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-max table-fixed">
                                    <colgroup>
                                        <col className="w-20" />
                                        <col className="w-44" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-canvas border-y border-secondary/10">
                                            <th className="px-4 py-1 text-center text-xs font-semibold text-fifth whitespace-nowrap">Date</th>
                                            <th className="px-4 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap">Location</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Players</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">High Score</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Avg Score</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Avg +/- Picks</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Total Songs Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Avg Songs Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Total Sets Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Avg Sets Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Opener Picks</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">Closer Picks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {gameShows.map((show) => {
                                            let bgColor = show.show_scored ? 'bg-canvas' : 'bg-primary';

                                            return (
                                                <tr
                                                    key={show.show_id}
                                                    className={`${bgColor} hover:bg-tertiary/40 transition-colors text-xs`}
                                                >
                                                    <td className="px-4 py-0.5 text-fifth text-center whitespace-nowrap">
                                                        <span className="font-medium">
                                                            <Link
                                                                to={`/setlistgame/${show.show_id}`}
                                                                className="hover:underline transition-colors table-link"
                                                            >
                                                                {formatDate(show.show_date)}
                                                            </Link>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-0.5 text-fifth font-light whitespace-nowrap">
                                                        {show.show_venue_location}
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.playerCount !== undefined ? show.playerCount : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fourth font-medium text-xs">
                                                            {show.show_scored && show.highScore !== undefined ? show.highScore : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.averageScore !== undefined ? show.averageScore.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className={`text-xs font-light ${show.show_scored && show.averageOverUnder && show.averageOverUnder > 0 ? 'text-red-600' : show.show_scored && show.averageOverUnder && show.averageOverUnder < 0 ? 'text-green-600' : 'text-fifth'}`}>
                                                            {show.show_scored && show.averageOverUnder !== undefined ? (show.averageOverUnder > 0 ? '+' : '') + show.averageOverUnder.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.totalCorrectSongs !== undefined ? show.totalCorrectSongs : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.averageCorrectSongs !== undefined ? show.averageCorrectSongs.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.totalCorrectSets !== undefined ? show.totalCorrectSets : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.averageCorrectSets !== undefined ? show.averageCorrectSets.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.usersPickedOpener !== undefined ? show.usersPickedOpener : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-fifth font-light text-xs">
                                                            {show.show_scored && show.usersPickedCloser !== undefined ? show.usersPickedCloser : '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Tour Standings */}
                    <div className="bg-primary border border-secondary rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl items-center font-semibold bg-tertiary text-fifth inline-flex px-3 py-1 rounded-lg border border-secondary whitespace-nowrap mb-2">
                                <Trophy className="w-5 h-5 mr-2" />
                                <span>Standings</span>
                            </h2>
                        </div>

                        {standings.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-fifth">No standings available yet for this tour.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse min-w-max table-fixed">
                                    <colgroup>
                                        <col className="w-12" />
                                        <col className="w-44" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                        <col className="w-[65px] min-w-[65px]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-canvas border-y border-secondary/10">
                                            <th className="px-1 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap text-center">
                                                Rank
                                            </th>
                                            <th className="px-3 py-1 text-left text-xs font-semibold text-fifth whitespace-nowrap">
                                                User
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Total Points
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Shows Played
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Points Per Show
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Songs Picked
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Sets Picked
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Openers
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-fifth">
                                                Closers
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {standings.map((player, index) => (
                                            <tr
                                                key={player.userId}
                                                className={`
                                                    ${user && player.userId === user.id
                                                    ? 'bg-tertiary/80'
                                                    : index % 2 === 0
                                                    ? 'bg-primary'
                                                    : 'bg-canvas'
                                                    } 
                                                hover:bg-tertiary/40 transition-colors
                                                `}
                                            >
                                                <td className="px-1 py-0.5 text-xs text-center font-medium text-fifth">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-0.5 whitespace-normal font-medium text-xs text-fifth">
                                                    {player.username}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-medium text-fourth">
                                                    {player.totalPoints}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.showsPlayed}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.avgPointsPerShow.toFixed(2)}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.songsPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.setsPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.showOpenersPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-fifth font-light">
                                                    {player.showClosersPicked}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}