import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface Review {
    rating: number;
    review: string;
    username: string;
}

interface UseRatingProps {
    showId: string;
    userId: string | null;
    isVisible: boolean;
}

export const useRating = ({ showId, userId, isVisible }: UseRatingProps) => {
    const [averageRating, setAverageRating] = useState<number>(0);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch average rating and user's rating
    const fetchRatings = useCallback(async () => {
        if (!showId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Test if the table exists and is accessible
            const { data: testData, error: testError } = await supabase
                .from('show_ratings')
                .select('uuid')
                .limit(1);

            if (testError) {
                console.error('Error accessing show_ratings table:', testError);
                setError(`Database error: ${testError.message}`);
                return;
            }

            // Fetch average rating and count
            const { data: avgData, error: avgError } = await supabase
                .from('show_ratings')
                .select('rating')
                .eq('show_id', showId);

            if (avgError) {
                console.error('Error fetching average rating:', avgError);
                setError(`Error fetching ratings: ${avgError.message}`);
                return;
            }

            if (avgData && avgData.length > 0) {
                const ratings = avgData.map(r => r.rating);
                const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                setAverageRating(Math.round(average * 100) / 100); // Round to 2 decimal places
                setRatingCount(ratings.length);
            } else {
                setAverageRating(0);
                setRatingCount(0);
            }

            // Fetch user's rating if logged in
            if (userId) {
                const { data: userData, error: userError } = await supabase
                    .from('show_ratings')
                    .select('rating')
                    .eq('show_id', showId)
                    .eq('user_id', userId)
                    .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

                if (userError) {
                    console.error('Error fetching user rating:', userError);
                } else if (userData) {
                    setUserRating(userData.rating);
                } else {
                    setUserRating(null);
                }
            }
        } catch (error) {
            console.error('Error in fetchRatings:', error);
            setError('Unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [showId, userId]);

    const fetchReviews = useCallback(async () => {
        if (!showId) return;

        try {
            setIsLoadingReviews(true);
            setError(null);

            // First get ratings with user IDs
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('show_ratings')
                .select('rating, review, user_id')
                .eq('show_id', showId)
                .order('rating', { ascending: false });

            if (ratingsError) {
                console.error('Error fetching ratings:', ratingsError);
                setError(`Error fetching reviews: ${ratingsError.message}`);
                return;
            }

            if (!ratingsData || ratingsData.length === 0) {
                setReviews([]);
                return;
            }

            // Get unique user IDs
            const userIds = [...new Set(ratingsData.map(r => r.user_id))];

            // Fetch usernames for these user IDs
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                // Continue with anonymous usernames if profiles fetch fails
            }

            // Create a lookup map for usernames
            const usernameMap = new Map();
            if (profilesData) {
                profilesData.forEach(profile => {
                    usernameMap.set(profile.id, profile.username);
                });
            }

            // Combine ratings with usernames
            const formattedReviews = ratingsData.map(item => ({
                rating: item.rating,
                review: item.review || '',
                username: usernameMap.get(item.user_id) || 'Anonymous'
            }));

            setReviews(formattedReviews);
        } catch (error) {
            console.error('Error in fetchReviews:', error);
            setError('Error loading reviews');
        } finally {
            setIsLoadingReviews(false);
        }
    }, [showId]);

    const handleStarClick = async (rating: number) => {
        if (!userId) {
            return false; // Indicates login required
        }

        try {
            setIsSaving(true);
            setError(null);

            // Check if user already has a rating for this show
            const { data: existingRating, error: checkError } = await supabase
                .from('show_ratings')
                .select('uuid, rating')
                .eq('show_id', showId)
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking existing rating:', checkError);
                setError(`Error saving rating: ${checkError.message}`);
                return false;
            }

            // Optimistically update the UI
            const oldUserRating = userRating;
            setUserRating(rating);

            if (existingRating) {
                // Update existing rating
                const { error: updateError } = await supabase
                    .from('show_ratings')
                    .update({ rating })
                    .eq('uuid', existingRating.uuid);

                if (updateError) {
                    console.error('Error updating rating:', updateError);
                    setError(`Error updating rating: ${updateError.message}`);
                    // Revert optimistic update
                    setUserRating(oldUserRating);
                    return false;
                }
            } else {
                // Insert new rating
                const { error: insertError } = await supabase
                    .from('show_ratings')
                    .insert({
                        show_id: showId,
                        user_id: userId,
                        rating
                    });

                if (insertError) {
                    console.error('Error inserting rating:', insertError);
                    setError(`Error saving rating: ${insertError.message}`);
                    // Revert optimistic update
                    setUserRating(oldUserRating);
                    return false;
                }
            }

            // Refresh the average rating
            await fetchRatings();
            return true;
        } catch (error) {
            console.error('Error in handleStarClick:', error);
            setError('Unexpected error occurred while saving rating');
            // Revert optimistic update
            setUserRating(userRating);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Reset state when showId changes
    useEffect(() => {
        if (isVisible) {
            // Reset all state when showId changes
            setAverageRating(0);
            setUserRating(null);
            setRatingCount(0);
            setIsLoading(true);
            setIsSaving(false);
            setError(null);

            // Then fetch new ratings
            fetchRatings();
        }
    }, [showId, isVisible, fetchRatings]);

    return {
        averageRating,
        userRating,
        isLoading,
        isSaving,
        ratingCount,
        reviews,
        isLoadingReviews,
        error,
        fetchReviews,
        handleStarClick,
        setError
    };
};
