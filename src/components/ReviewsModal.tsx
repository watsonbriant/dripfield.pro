import React, { useState } from 'react';
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
    onRatingSave?: (rating: number) => Promise<boolean>;
    isSaving?: boolean;
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
    onRatingSave,
    isSaving = false
}) => {
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [saveError, setSaveError] = useState<string | null>(null);

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

    // Calculate which rating to display for stars (hover or user rating)
    const displayRating = isHovering ? hoveredRating : (userRating || 0);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-3" onClick={onClose}>
            <div className="bg-primary border border-fourth max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="p-2 border-b border-fourth relative">
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
                            <div className="flex items-center gap-3">
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
                            </div>
                            {saveError && (
                                <div className="mt-2 text-xs text-red-400">
                                    {saveError}
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
                
                <div className="overflow-y-auto max-h-[60vh] p-2">
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
                        <div className="space-y-1">
                            {reviews.map((review, index) => (
                                <div key={index} className="border-b border-fourth last:border-b-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="flex items-center">
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
                                        <span className="text-xs font-medium text-fourth">
                                            {review.username}
                                        </span>
                                    </div>
                                    {review.review && (
                                        <p className="text-fifth text-[0.625rem]">
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
};

export default ReviewsModal;
