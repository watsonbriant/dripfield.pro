import React from 'react';
import { Star } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

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
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ 
    onClose, 
    averageRating, 
    reviews, 
    isLoadingReviews, 
    error, 
    showDate, 
    showVenueLocation 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3" onClick={onClose}>
            <div className="bg-primary border border-secondary rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b border-secondary relative">
                    <div>
                        <div>
                            <h3 className="text-xl font-medium text-fifth">
                                {showDate 
                                    ? formatInTimeZone(new Date(showDate), 'UTC', 'MM.dd.yy')
                                    : 'Show Reviews'
                                }
                            </h3>
                            {showVenueLocation && (
                                <p className="text-sm text-fifth/70">{showVenueLocation}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-5 mt-1">
                            {/* Average rating stars */}
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((starNumber) => {
                                    const fillPercentage = Math.min(Math.max(averageRating - starNumber + 1, 0), 1);
                                    
                                    return (
                                        <div key={starNumber} className="relative">
                                            <Star
                                                size={16}
                                                className="text-secondary"
                                                fill="none"
                                                stroke="currentColor"
                                            />
                                            <div
                                                className="absolute inset-0 overflow-hidden"
                                                style={{ width: `${fillPercentage * 100}%` }}
                                            >
                                                <Star
                                                    size={16}
                                                    className="text-tertiary"
                                                    fill="currentColor"
                                                    stroke="currentColor"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-sm font-medium text-fifth">
                                {averageRating > 0 ? averageRating.toFixed(2) : ''}
                            </span>
                            <p className="text-sm text-fifth/70">
                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 hover:bg-tertiary bg-red-600 border border-secondary rounded transition-colors text-fifth"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="overflow-y-auto max-h-[60vh] p-3">
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
                        <div className="space-y-2">
                            {reviews.map((review, index) => (
                                <div key={index} className="border-b border-secondary pb-2 last:border-b-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((starNumber) => (
                                                <Star
                                                    key={starNumber}
                                                    size={16}
                                                    className={`${
                                                        starNumber <= review.rating
                                                            ? 'text-tertiary'
                                                            : 'text-secondary'
                                                    }`}
                                                    fill={starNumber <= review.rating ? 'currentColor' : 'none'}
                                                    stroke="currentColor"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium text-fourth">
                                            {review.username}
                                        </span>
                                    </div>
                                    {review.review && (
                                        <p className="text-fifth text-[0.75rem] leading-[1rem]">
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
