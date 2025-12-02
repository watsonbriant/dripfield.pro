import { useAuth } from '../context/AuthContext';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useSetlistTourData } from '../hooks/useSetlistTourData';
import { useTourStats } from '../hooks/useTourStats';
import { TourHeader } from './tour/TourHeader';
import { ShowsTable } from './tour/ShowsTable';
import { StandingsTable } from './tour/StandingsTable';
import { LoadingSpinner } from './tour/LoadingSpinner';

export function TourDetailsPage() {
    const { tourId } = useParams<{ tourId: string }>();
    const { user } = useAuth();
    
    // Use custom hooks for data fetching
    const { loading, tourInfo, gameShows } = useSetlistTourData(tourId);
    const { standings, tourStats } = useTourStats(tourInfo);


    return (
        <div className="max-w-[1280px] mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center mb-6 font-semibold text-sm text-fifth shadow-xl">
                <Link to="/setlistgame" className="hover:underline transition-colors">
                    <div className="flex items-center bg-tertiary rounded-lg py-1 px-2 border border-fourth text-fifth">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Echo of a Show
                    </div>
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-fifth bg-canvas rounded-lg py-1 px-2 border border-fourth">
                    {tourInfo?.tour || 'Tour Details'}
                </span>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-4">
                    <TourHeader tourInfo={tourInfo} tourStats={{ ...tourStats, totalShows: gameShows.length }} />
                    <ShowsTable gameShows={gameShows} />
                    <StandingsTable standings={standings} currentUserId={user?.id} />
                </div>
            )}
        </div>
    );
}