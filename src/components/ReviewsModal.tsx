import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import StarDisplay from './StarDisplay';

interface Review {
    rating: number;
    review: string;
    username: string;
}

interface ReviewsModalProps {
    onClose: () => void;
    averageRating: number;
    reviews: Review[];
    isLoadingReviews: boolean;
    error: string | null;
    showDate?: string;
    showVenueLocation?: string;
    showId?: string;
    userId?: string | null;
    userRating?: number | null;
    userReview?: string | null;
    onRatingSave?: (rating: number) => Promise<boolean>;
    onReviewSave?: (review: string) => Promise<boolean>;
    isSaving?: boolean;
    isSavingReview?: boolean;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ 
    onClose, 
    averageRating, 
    reviews, 
    isLoadingReviews, 
    error, 
    showDate, 
    showVenueLocation,
    showId,
    userId,
    userRating,
    userReview,
    onRatingSave,
    onReviewSave,
    isSaving = false,
    isSavingReview = false
}) => {
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showReviewInput, setShowReviewInput] = useState<boolean>(false);
    const [reviewText, setReviewText] = useState<string>(userReview || '');
    const [reviewError, setReviewError] = useState<string | null>(null);

    const handleStarClick = async (rating: number) => {
        if (!userId || !onRatingSave) {
            return;
        }
        
        setSaveError(null);
        const success = await onRatingSave(rating);
        if (!success) {
            setSaveError('Failed to save rating. Please try again.');
        }
    };

    // Sync reviewText with userReview when it changes
    useEffect(() => {
        setReviewText(userReview || '');
    }, [userReview]);

    // Validate review text (alphanumeric, spaces, and basic punctuation only)
    const validateReview = (text: string): boolean => {
        if (!text.trim()) return true; // Empty is valid
        const alphanumericRegex = /^[a-zA-Z0-9\s.,!?'"()<>—–-]+$/;
        return alphanumericRegex.test(text);
    };

    const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setReviewText(value);
        // Clear error when user starts typing
        if (reviewError) {
            setReviewError(null);
        }
    };

    const handleSaveReview = async () => {
        if (!onReviewSave) return;
        
        setReviewError(null);
        
        // Validate before saving
        if (!validateReview(reviewText)) {
            setReviewError('Review can only contain letters, numbers, spaces, and basic punctuation');
            return;
        }
        
        const success = await onReviewSave(reviewText);
        if (success) {
            setShowReviewInput(false);
        } else {
            setReviewError('Failed to save review. Please try again.');
        }
    };

    const handleCancelReview = () => {
        setReviewText(userReview || '');
        setReviewError(null);
        setShowReviewInput(false);
    };

    // Calculate which rating to display for stars (hover or user rating)
    const displayRating = isHovering ? hoveredRating : (userRating || 0);
    
    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-3" onClick={onClose}>
            <div className="bg-primary border border-fourth max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="p-2 border-b border-fourth relative bg-canvas">
                    <div>
                        <div>
                            <h3 className="text-base font-medium text-fifth">
                                {showDate 
                                    ? formatInTimeZone(new Date(showDate), 'UTC', 'MM.dd.yy')
                                    : 'Show Reviews'
                                }
                            </h3>
                            {showVenueLocation && (
                                <p className="text-xs text-fifth/70">{showVenueLocation}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-5 mb-3">
                            {/* Average rating stars */}
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((starNumber) => {
                                    const fillPercentage = Math.min(Math.max(averageRating - starNumber + 1, 0), 1);
                                    
                                    return (
                                        <div key={starNumber} className="relative">
                                            <Star
                                                size={14}
                                                className="text-fourth"
                                                fill="none"
                                                stroke="currentColor"
                                            />
                                            <div
                                                className="absolute inset-0 overflow-hidden"
                                                style={{ width: `${fillPercentage * 100}%` }}
                                            >
                                                <Star
                                                    size={14}
                                                    className="text-fourth"
                                                    fill="currentColor"
                                                    stroke="currentColor"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-xs font-medium text-fifth">
                                {averageRating > 0 ? averageRating.toFixed(2) : ''}
                            </span>
                            <p className="text-xs text-fifth/70">
                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    
                    {/* User rating section */}
                    {userId && (
                        <div className="mt-1 pt-1 border-t border-fourth">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-medium text-fifth">
                                    {userRating ? 'Your rating:' : 'Rate this show:'}
                                </span>
                                <StarDisplay
                                    rating={displayRating}
                                    isInteractive={true}
                                    isHovering={isHovering}
                                    onStarClick={handleStarClick}
                                    onMouseEnter={(rating) => {
                                        setIsHovering(true);
                                        setHoveredRating(rating);
                                    }}
                                    onMouseLeave={() => {
                                        setIsHovering(false);
                                        setHoveredRating(0);
                                    }}
                                    size={14}
                                    title="Click to rate this show"
                                />
                                {isSaving && (
                                    <div className="w-4 h-4 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {userRating && (
                                    <span className="text-[0.625rem] text-fifth/70">
                                        ({userRating} star{userRating !== 1 ? 's' : ''})
                                    </span>
                                )}
                                {!showReviewInput ? (
                                    <button
                                        onClick={() => {
                                            if (!userRating) {
                                                setSaveError('Please rate this show before leaving a review');
                                                return;
                                            }
                                            setShowReviewInput(true);
                                        }}
                                        className="text-xs font-medium text-fifth bg-tertiary hover:bg-fourth hover:text-white border border-fourth rounded px-3 py-0.5 transition-colors"
                                    >
                                        {userReview ? 'Edit Review' : 'Write a Review'}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSaveReview}
                                            disabled={isSavingReview}
                                            className="text-xs font-medium text-white bg-fourth hover:bg-fourth/80 border border-fourth rounded px-3 py-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSavingReview ? 'Saving...' : 'Save Review'}
                                        </button>
                                        <button
                                            onClick={handleCancelReview}
                                            disabled={isSavingReview}
                                            className="text-xs font-medium text-fifth bg-tertiary hover:bg-tertiary/80 border border-fourth rounded px-3 py-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                            {saveError && (
                                <div className="mt-2 text-xs text-red-400">
                                    {saveError}
                                </div>
                            )}
                            
                            {/* Review Textarea */}
                            {showReviewInput && (
                                <div className="mt-2 space-y-2">
                                    <textarea
                                        value={reviewText}
                                        onChange={handleReviewChange}
                                        placeholder="Write your review here..."
                                        className="w-full text-[0.625rem] leading-[0.625rem] text-fifth bg-primary border border-fourth rounded p-1 resize-none focus:outline-none focus:border-fourth"
                                        rows={4}
                                        disabled={isSavingReview}
                                    />
                                    {reviewError && (
                                        <div className="text-xs text-red-400">
                                            {reviewError}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Display existing review when not editing */}
                            {userReview && !showReviewInput && (
                                <div className="mt-2 text-[0.625rem] text-fifth leading-[0.625rem]">
                                    <span className="font-medium pr-2 text-xs">Your review:</span> {userReview}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-0.5 right-0.5 p-0.5 hover:bg-tertiary bg-red-600 border border-fourth transition-colors text-fifth"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto overflow-x-hidden max-h-[60vh] p-2">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {isLoadingReviews ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-2 border-fifth border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-fifth/70">
                            No written reviews yet for this show.
                        </div>
                    ) : (
                        <div className="space-y-1 w-full">
                            {reviews.map((review, index) => (
                                <div key={index} className="border-b border-fourth last:border-b-0 min-w-0 w-full">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="flex items-center flex-shrink-0">
                                            {[1, 2, 3, 4, 5].map((starNumber) => (
                                                <Star
                                                    key={starNumber}
                                                    size={12}
                                                    className={`${
                                                        starNumber <= review.rating
                                                            ? 'text-fourth'
                                                            : 'text-fourth'
                                                    }`}
                                                    fill={starNumber <= review.rating ? 'currentColor' : 'none'}
                                                    stroke="currentColor"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs font-medium text-fourth flex-shrink-0">
                                            {review.username}
                                        </span>
                                    </div>
                                    {review.review && (
                                        <p className="text-fifth text-[0.625rem] leading-[0.625rem] break-words w-full max-w-full whitespace-normal" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                            {review.review}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Use portal to render modal at document body level
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    
    return null;
};

export default ReviewsModal;
