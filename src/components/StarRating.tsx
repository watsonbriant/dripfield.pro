import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRating } from '../hooks/useRating';
import LoginModal from './LoginModal';
import ReviewsModal from './ReviewsModal';
import StarDisplay from './StarDisplay';

interface StarRatingProps {
    showId: string;
    isVisible: boolean;
    className?: string;
    showDate?: string;
    showVenueLocation?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ showId, isVisible, className = '', showDate, showVenueLocation }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);

    const {
        averageRating,
        userRating,
        isLoading,
        isSaving,
        ratingCount,
        reviews,
        isLoadingReviews,
        error,
        fetchReviews,
        handleStarClick
    } = useRating({ showId, userId: user?.id || null, isVisible });

    // Handle star click
    const onStarClick = async (rating: number) => {
        const success = await handleStarClick(rating);
        if (!success && !user) {
            setShowModal(true);
        }
    };

    const handleLogin = () => {
        setShowModal(false);
        navigate('/login');
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleShowReviews = async () => {
        setShowReviewsModal(true);
        await fetchReviews();
    };

    // Calculate which rating to display for stars (hover or average)
    const displayRating = isHovering ? hoveredRating : averageRating;

    if (!isVisible) {
        return null;
    }

    return (
        <>
            <div className={`flex items-center gap-6 ${className}`}>
                <StarDisplay
                    rating={displayRating}
                    isInteractive={true}
                    isHovering={isHovering}
                    onStarClick={onStarClick}
                    onMouseEnter={(rating) => {
                        setIsHovering(true);
                        setHoveredRating(rating);
                    }}
                    onMouseLeave={() => {
                        setIsHovering(false);
                        setHoveredRating(0);
                    }}
                    title={
                        !user
                            ? "Log in to rate this show"
                            : `Rate this show`
                    }
                />

                {/* Rating text and count */}
                <div className="flex-1 flex justify-start lg:justify-end text-sm text-fifth">
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>
                    ) : error ? (
                        <div className="text-red-400 text-xs" title={error}>
                            Error loading ratings
                        </div>
                    ) : (
                        <div 
                            className="text-right lg:text-left cursor-pointer hover:text-fourth hover:underline transition-colors"
                            onClick={handleShowReviews}
                            title="Click to see reviews"
                        >
                            <span className="font-medium">
                                {averageRating > 0 ? averageRating.toFixed(2) : ''}
                            </span>
                            {ratingCount > 0 && (
                                <span className="text-xs text-fifth/70 ml-2">
                                    ({ratingCount} review{ratingCount > 1 ? 's' : ''})
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

            {/* Error display */}
            {error && !isLoading && (
                <div className="text-xs text-red-400 mt-1">
                    {error}
                </div>
            )}

            {showModal && (
                <LoginModal onClose={handleCloseModal} onLogin={handleLogin} />
            )}

            {showReviewsModal && (
                <ReviewsModal 
                    onClose={() => setShowReviewsModal(false)}
                    averageRating={averageRating}
                    reviews={reviews}
                    isLoadingReviews={isLoadingReviews}
                    error={error}
                    showDate={showDate}
                    showVenueLocation={showVenueLocation}
                />
            )}
        </>
    );
};

export default StarRating;