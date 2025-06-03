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

export function TourDetailsPage() {
    const { tourName } = useParams<{ tourName: string }>();
    const [loading, setLoading] = useState(true);
    const [gameShows, setGameShows] = useState<GameShow[]>([]);
    const [tourStats, setTourStats] = useState({
        totalShows: 0,
        totalPlayers: 0,
        tourWinners: [] as { username: string, score: number }[]
    });
    const [standings, setStandings] = useState<PlayerStats[]>([]);
    const { user } = useAuth();

    // Fetch all tour shows
    const fetchTourShows = useCallback(async () => {
        if (!tourName) return;

        try {
            setLoading(true);

            // Get all shows for this tour
            const { data, error } = await supabase
                .from('shows')
                .select('show_id, show_date, show_subvenue, show_venue_location, show_time, show_tour, show_scored, show_detail, show_canonid, show_subvenue_venue')
                .eq('show_tour', tourName)
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
                            const submissionPicks = {};
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
                            show.usersPickedOpener = Object.values(submissionPicks).filter(p => p.pickedOpener).length;
                            show.usersPickedCloser = Object.values(submissionPicks).filter(p => p.pickedCloser).length;
                            
                            // Calculate averages per user
                            const submissionValues = Object.values(submissionPicks);
                            if (submissionValues.length > 0) {
                                const totalCorrectSongs = submissionValues.reduce((sum, val) => sum + val.correctSongs, 0);
                                const totalCorrectSets = submissionValues.reduce((sum, val) => sum + val.correctSets, 0);
                                
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
    }, [tourName]);

    // Fetch tour statistics and standings
    const fetchTourStats = useCallback(async () => {
        if (!tourName) return;

        try {
            // Get all scored shows for this tour
            const { data: showData, error: showError } = await supabase
                .from('shows')
                .select('show_id')
                .eq('show_tour', tourName)
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
    }, [tourName]);

    // Initial data fetching
    useEffect(() => {
        fetchTourShows();
        fetchTourStats();
    }, [fetchTourShows, fetchTourStats]);

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
            <div className="flex items-center mb-6 font-semibold text-sm text-black/70">
                <Link to="/setlistgame" className="hover:text-[#a9682e] transition-colors">
                    <div className="flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Echo of a Show
                    </div>
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-black">
                    {tourName || 'Tour Details'}
                </span>
            </div>

            {loading ? (
                <div className="text-center py-12 bg-primary border border-black rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-black mt-4">Loading tour details...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tour Info Card */}
                    <div className="bg-primary border border-black rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div>
                                <h1 className="text-2xl font-mohr bg-[#f9ae37] text-black inline-block px-4 pt-1.5 pb-0 rounded-full border border-black">{tourName}</h1>
                                <div className="mt-2 flex gap-3">
                                    <div className="flex items-center">
                                        <span className="text-black/70 text-sm">Shows:</span>
                                        <span className="ml-1 mr-1 text-sm font-semibold text-black">{tourStats.totalShows}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-black/70 text-sm">Players:</span>
                                        <span className="ml-1 text-sm font-semibold text-black">{tourStats.totalPlayers}</span>
                                    </div>
                                </div>
                            </div>

                            {tourStats.tourWinners.length > 0 && (
                                <div className="mt-4 md:mt-0">
                                    <div className="bg-[#f9ae37]/30 rounded-md p-3 border border-[#f9ae37]">
                                        <div className="flex items-center">
                                            <Trophy className="w-5 h-5 text-black mr-2" />
                                            <span className="font-semibold text-black mr-2">Tour Champion{tourStats.tourWinners.length > 1 ? 's' : ''}: </span>
                                            <div className="ml-1 flex flex-wrap">
                                                {tourStats.tourWinners.map((winner, idx) => (
                                                    <span key={idx} className="text-[#a9682e] font-bold">
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

                    {/* Tour Shows Table */}
                    <div className="bg-primary border border-black rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-flex items-center px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                                <ListMusic className="w-5 h-5 mr-2" />
                                <span>Shows</span>
                            </h2>
                        </div>

                        {gameShows.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-black">No shows found for this tour.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                                <table className="w-full border-collapse min-w-max table-fixed">
                                    <colgroup>
                                        <col className="w-28" /> {/* Date column */}
                                        <col className="w-44" /> {/* Location column */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Players */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* High Score */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Avg Score */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Avg +/- */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Total Songs */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Avg Songs */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Total Sets */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Avg Sets */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Opener Picks */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Closer Picks */}
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-canvas border-y border-black/10">
                                            <th className="px-4 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">Date</th>
                                            <th className="px-4 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">Location</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Players</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">High Score</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Score</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg +/- Picks</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Total Songs Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Songs Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Total Sets Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Avg Sets Correct</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Opener Picks</th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">Closer Picks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {gameShows.map((show) => {
                                            let bgColor = show.show_scored ? 'bg-canvas' : 'bg-primary';

                                            return (
                                                <tr
                                                    key={show.show_id}
                                                    className={`${bgColor} hover:bg-black/10 transition-colors text-xs`}
                                                >
                                                    <td className="px-4 py-0.5 text-black whitespace-nowrap">
                                                        <span className="font-semibold">
                                                            <Link
                                                                to={`/setlistgame/${show.show_id}`}
                                                                className="hover:text-[#a9682e] transition-colors table-link"
                                                            >
                                                                {formatDate(show.show_date)}
                                                            </Link>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-0.5 text-black/70 whitespace-nowrap">
                                                        {show.show_venue_location}
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.playerCount !== undefined ? show.playerCount : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black font-semibold text-xs">
                                                            {show.highScore !== undefined ? show.highScore : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.averageScore !== undefined ? show.averageScore.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className={`text-xs ${show.averageOverUnder > 0 ? 'text-red-600' : show.averageOverUnder < 0 ? 'text-green-600' : 'text-black/70'}`}>
                                                            {show.averageOverUnder !== undefined ? (show.averageOverUnder.toFixed(2) > 0 ? '+' : '') + show.averageOverUnder.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.totalCorrectSongs !== undefined ? show.totalCorrectSongs : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.averageCorrectSongs !== undefined ? show.averageCorrectSongs.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.totalCorrectSets !== undefined ? show.totalCorrectSets : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.averageCorrectSets !== undefined ? show.averageCorrectSets.toFixed(2) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.usersPickedOpener !== undefined ? show.usersPickedOpener : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-0.5 py-0.5 text-center">
                                                        <span className="text-black/70 text-xs">
                                                            {show.usersPickedCloser !== undefined ? show.usersPickedCloser : '-'}
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
                    <div className="bg-primary border border-black rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-flex items-center px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                                <Trophy className="w-5 h-5 mr-2" />
                                <span>Standings</span>
                            </h2>
                        </div>

                        {standings.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-black">No standings available yet for this tour.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                                <table className="w-full border-collapse min-w-max table-fixed">
                                    <colgroup>
                                        <col className="w-12" /> {/* Rank column - narrow */}
                                        <col className="w-44" /> {/* User column - flexible but with minimum width */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Total Points */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Shows Played */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Points Per Show */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Songs Correctly Picked */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Sets Correctly Picked */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Show Openers Picked */}
                                        <col className="w-[65px] min-w-[65px]" /> {/* Show Closers Picked */}
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-canvas border-y border-black/10">
                                            <th className="px-1 py-1 text-left text-xs font-semibold text-black whitespace-nowrap text-center">
                                                Rank
                                            </th>
                                            <th className="px-3 py-1 text-left text-xs font-semibold text-black whitespace-nowrap">
                                                User
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Total Points
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Shows Played
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Points Per Show
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Songs Picked
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Sets Picked
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
                                                Openers
                                            </th>
                                            <th className="px-0.5 py-1 text-center text-xs font-semibold text-black">
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
                                                        ? 'bg-[#f9ae37]'
                                                        : index % 2 === 0
                                                            ? 'bg-primary'
                                                            : 'bg-canvas'
                                                    } 
                          hover:bg-black/10 transition-colors
                        `}
                                            >
                                                <td className="px-1 py-0.5 text-xs text-center font-semibold text-black">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-0.5 whitespace-normal font-medium text-xs text-black">
                                                    {player.username}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center font-semibold text-black">
                                                    {player.totalPoints}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                                                    {player.showsPlayed}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                                                    {player.avgPointsPerShow.toFixed(2)}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                                                    {player.songsPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                                                    {player.setsPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
                                                    {player.showOpenersPicked}
                                                </td>
                                                <td className="px-0.5 py-0.5 whitespace-nowrap text-xs text-center text-black">
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