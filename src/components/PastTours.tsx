import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface TourStats {
  tour: string;
  tour_id: string;  // Add this line
  playerCount: number;
  showCount: number;
  winners: Array<{
    username: string;
    score: number;
  }>;
  canonId?: number;
}

export function PastTours({ currentLeague }: { currentLeague: string }) {
  const [loading, setLoading] = useState(true);
  const [pastTours, setPastTours] = useState<TourStats[]>([]);
  
  useEffect(() => {
    async function fetchPastTours() {
      try {
        setLoading(true);
        
        // Get a list of all tours from the tours table first
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select('tour, tour_id, tour_canonid')
          .neq('tour', currentLeague);
          
        if (toursError) {
          console.error('Error fetching tours:', toursError);
          return;
        }
        
        if (!toursData || toursData.length === 0) {
          setLoading(false);
          return;
        }
        
        // Create a map to store tour stats
        const tourMap = new Map<string, {
          userIds: Set<string>,
          showIds: Set<string>,
          userScores: Map<string, number>,
          canonId?: number;
          tourId: string;  // Add this line
        }>();
        
        // Initialize the map with all tours
        toursData.forEach(tourData => {
          tourMap.set(tourData.tour, {
            userIds: new Set(),
            showIds: new Set(),
            userScores: new Map(),
            canonId: tourData.tour_canonid,
            tourId: tourData.tour_id  // Add this line
          });
        });
        
        // Get all shows for these tours
        const { data: showsData, error: showsError } = await supabase
          .from('shows')
          .select('show_id, show_tour')
          .in('show_tour', toursData.map(t => t.tour))
          .eq('show_issetlistgame', true)
          .eq('show_scored', true);
          
        if (showsError) {
          console.error('Error fetching shows:', showsError);
          return;
        }
        
        if (!showsData || showsData.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get all submissions for these shows
        const showIds = showsData.map(show => show.show_id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('setlist_game_submissions')
          .select('submission_id, user_id, show_id, score')
          .in('show_id', showIds)
          .not('score', 'is', null); // Changed from neq('score', null) to fix the type issue
          
        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          return;
        }
        
        if (!submissionsData || submissionsData.length === 0) {
          setLoading(false);
          return;
        }
        
        // Create a map of show_id to tour
        const showToTourMap = new Map();
        showsData.forEach(show => {
          showToTourMap.set(show.show_id, show.show_tour);
        });
        
        // Process submissions into tour stats
        submissionsData.forEach(submission => {
          const tour = showToTourMap.get(submission.show_id);
          if (!tour || tour === currentLeague) return;
          
          const tourData = tourMap.get(tour);
          if (!tourData) return;
          
          tourData.userIds.add(submission.user_id);
          tourData.showIds.add(submission.show_id);
          
          // Add to score total for this user
          const currentScore = tourData.userScores.get(submission.user_id) || 0;
          tourData.userScores.set(submission.user_id, currentScore + (submission.score || 0));
        });
        
        // Get all usernames to display winners
        const userIds = Array.from(new Set(
          submissionsData.map(submission => submission.user_id)
        ));
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }
        
        const usernameMap = new Map();
        if (profiles) {
          profiles.forEach(profile => {
            usernameMap.set(profile.id, profile.username);
          });
        }
        
        // Convert to array of TourStats
        const tourStats: TourStats[] = [];
        
        tourMap.forEach((data, tour) => {
          // Skip tours with no data
          if (data.showIds.size === 0) return;
          
          // Find winners (users with max score)
          let maxScore = -Infinity;
          let winners: Array<{username: string, score: number}> = [];
          
          data.userScores.forEach((score, userId) => {
            const username = usernameMap.get(userId) || 'Unknown';
            if (score > maxScore) {
              maxScore = score;
              winners = [{ username, score }];
            } else if (score === maxScore) {
              winners.push({ username, score });
            }
          });
          
          tourStats.push({
            tour,
            tour_id: data.tourId,  // Add this line
            playerCount: data.userIds.size,
            showCount: data.showIds.size,
            winners,
            canonId: data.canonId
          });
        });
        
        // Sort by tour_canonid
        tourStats.sort((a, b) => {
          if (a.canonId && b.canonId) {
            return b.canonId - a.canonId; // Sort in descending order (most recent first)
          }
          
          // Fallback to sorting by tour name if canonId is not available
          return b.tour.localeCompare(a.tour);
        });
        
        setPastTours(tourStats);
      } catch (error) {
        console.error('Error in fetchPastTours:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPastTours();
  }, [currentLeague]);

  if (loading) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3 shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">
            Past Tours
          </h2>
        </div>
        <div className="text-center py-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading past tours...</p>
        </div>
      </div>
    );
  }

  if (pastTours.length === 0) {
    return (
      <div className="bg-primary border border-fourth rounded-lg p-3 shadow-xl">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h2 className="text-sm font-semibold">
            Past Tours
          </h2>
        </div>
        <div className="text-center py-6">
          <p className="text-fifth">No past tours found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary border border-fourth shadow-xl">
      <div className="bg-tertiary text-fifth px-2 py-0.5">
        <h2 className="text-sm font-semibold">
          Past Tours
        </h2>
      </div>
      
      <div className="overflow-x-auto shadow-xl">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-canvas border-y border-white/10">
              <th className="px-2 py-1 text-left text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Tour</th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Players</th>
              <th className="px-2 py-1 text-center text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Shows</th>
              <th className="px-2 py-1 text-left text-xs leading-[0.75rem] font-medium text-fifth whitespace-nowrap">Winner(s)</th>
            </tr>
          </thead>
          <tbody>
            {pastTours.map((tour) => (
              <tr 
                key={tour.tour}
                className="bg-primary hover:bg-tertiary/40 transition-colors text-[0.625rem]"
              >
                <td className="px-2 text-fifth whitespace-nowrap font-medium">
                <Link 
                  to={`/setlistgame/tour/${tour.tour_id}`}
                  className="hover:underline transition-colors table-link"
                >
                  {tour.tour}
                </Link>
                </td>
                <td className="px-2 text-center font-light text-fifth whitespace-nowrap">
                  {tour.playerCount}
                </td>
                <td className="px-2 text-center font-light text-fifth whitespace-nowrap">
                  {tour.showCount}
                </td>
                <td className="px-2 text-fifth whitespace-nowrap">
                  {tour.winners.length > 0 ? (
                    <div className="flex items-center">
                      <span className="text-fourth font-medium">
                        {tour.winners.map((winner, idx) => (
                          <span key={winner.username}>
                            {winner.username}&nbsp;&nbsp;<span className="font-light">({winner.score})</span>
                            {idx < tour.winners.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  ) : (
                    <span className="text-fifth/50 italic">No scores</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}