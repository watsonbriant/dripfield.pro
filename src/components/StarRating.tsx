import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface StarRatingProps {
    showId: string;
    isVisible: boolean;
    className?: string;
}

// Login modal component matching the app's aesthetic
const LoginModal: React.FC<{ onClose: () => void, onLogin: () => void }> = ({ onClose, onLogin }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-primary border border-secondary rounded-lg p-4 max-w-sm mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-medium text-fifth mb-3">Login Required</h3>
                <p className="mb-4 text-fifth text-sm font-light">You must be logged in to rate this show.</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-1 border border-secondary rounded-lg text-fifth hover:bg-red-500/50 transition-colors text-sm font-medium bg-red-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onLogin}
                        className="px-4 py-1 bg-tertiary border border-secondary rounded-lg text-fifth hover:bg-primary transition-colors text-sm font-medium"
                    >
                        Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

const StarRating: React.FC<StarRatingProps> = ({ showId, isVisible, className = '' }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [averageRating, setAverageRating] = useState<number>(0);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [ratingCount, setRatingCount] = useState<number>(0);

    // Fetch average rating and user's rating
    const fetchRatings = useCallback(async () => {
        if (!showId) return;

        try {
            setIsLoading(true);

            // Fetch average rating and count
            const { data: avgData, error: avgError } = await supabase
                .from('show_ratings')
                .select('rating')
                .eq('show_id', showId);

            if (avgError) {
                console.error('Error fetching average rating:', avgError);
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
            if (user) {
                const { data: userData, error: userError } = await supabase
                    .from('show_ratings')
                    .select('rating')
                    .eq('show_id', showId)
                    .eq('user_id', user.id)
                    .single();

                if (userError && userError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    console.error('Error fetching user rating:', userError);
                } else if (userData) {
                    setUserRating(userData.rating);
                }
            }
        } catch (error) {
            console.error('Error in fetchRatings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [showId, user]);

    // Reset state when showId changes
    useEffect(() => {
        if (isVisible) {
            // Reset all state when showId changes
            setAverageRating(0);
            setUserRating(null);
            setRatingCount(0);
            setIsLoading(true);
            setIsSaving(false);
            setIsHovering(false);
            setHoveredRating(0);

            // Then fetch new ratings
            fetchRatings();
        }
    }, [showId, isVisible, fetchRatings]);

    // Handle star click
    const handleStarClick = async (rating: number) => {
        if (!user) {
            setShowModal(true);
            return;
        }

        try {
            setIsSaving(true);

            // Check if user already has a rating for this show
            const { data: existingRating, error: checkError } = await supabase
                .from('show_ratings')
                .select('rating')
                .eq('show_id', showId)
                .eq('user_id', user.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing rating:', checkError);
                return;
            }

            // Optimistically update the UI
            const oldUserRating = userRating;
            setUserRating(rating);

            if (existingRating) {
                // Update existing rating
                const { error: updateError } = await supabase
                    .from('show_ratings')
                    .update({ rating })
                    .eq('show_id', showId)
                    .eq('user_id', user.id);

                if (updateError) {
                    console.error('Error updating rating:', updateError);
                    // Revert optimistic update
                    setUserRating(oldUserRating);
                    return;
                }
            } else {
                // Insert new rating
                const { error: insertError } = await supabase
                    .from('show_ratings')
                    .insert({
                        show_id: showId,
                        user_id: user.id,
                        rating
                    });

                if (insertError) {
                    console.error('Error inserting rating:', insertError);
                    // Revert optimistic update
                    setUserRating(oldUserRating);
                    return;
                }
            }

            // Refresh the average rating
            await fetchRatings();
        } catch (error) {
            console.error('Error in handleStarClick:', error);
            // Revert optimistic update
            setUserRating(userRating);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogin = () => {
        setShowModal(false);
        navigate('/login');
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Calculate which rating to display for stars (hover or average)
    const displayRating = isHovering ? hoveredRating : averageRating;

    if (!isVisible) {
        return null;
    }

    return (
        <>
            <div className={`flex items-center gap-6 ${className}`}>
                <div
                    className="flex items-center"
                    onMouseLeave={() => {
                        setIsHovering(false);
                        setHoveredRating(0);
                    }}
                >
                    {[1, 2, 3, 4, 5].map((starNumber) => {
                        const fillPercentage = Math.min(Math.max(displayRating - starNumber + 1, 0), 1);

                        return (
                            <div
                                key={starNumber}
                                className="relative cursor-pointer"
                                onMouseEnter={() => {
                                    setIsHovering(true);
                                    setHoveredRating(starNumber);
                                }}
                                onClick={() => handleStarClick(starNumber)}
                                title={
                                    !user
                                        ? "Log in to rate this show"
                                        : `Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`
                                }
                            >
                                {/* Background star (empty) */}
                                <Star
                                    size={20}
                                    className="text-secondary"
                                    fill="none"
                                    stroke="currentColor"
                                />

                                {/* Foreground star (filled) */}
                                <div
                                    className="absolute inset-0 overflow-hidden"
                                    style={{ width: `${fillPercentage * 100}%` }}
                                >
                                    <Star
                                        size={20}
                                        className={`${isHovering
                                                ? 'text-fourth'
                                                : 'text-tertiary'
                                            }`}
                                        fill="currentColor"
                                        stroke="currentColor"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rating text and count */}
                <div className="flex-1 flex justify-start lg:justify-end text-sm text-fifth">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <div className="text-right lg:text-left">
                            <span className="font-medium">
                                {averageRating > 0 ? averageRating.toFixed(2) : ''}
                            </span>
                            {ratingCount > 0 && (
                                <span className="text-xs text-fifth/70 ml-2">
                                    ({ratingCount} rating{ratingCount > 1 ? 's' : ''})
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {isSaving && (
                    <div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>

            {/* User's rating on its own line */}
            {userRating && (
                <div className="text-xs text-fourth font-normal">
                    Your rating: {userRating}
                </div>
            )}

            {showModal && (
                <LoginModal onClose={handleCloseModal} onLogin={handleLogin} />
            )}
        </>
    );
};

export default StarRating;