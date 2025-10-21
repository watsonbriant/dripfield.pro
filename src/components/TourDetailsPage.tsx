import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTourDetails } from '../hooks/useTourDetails';
import { TourDetailsBreadcrumbs } from './tourDetails/TourDetailsBreadcrumbs';
import { TourDetailsLoading } from './tourDetails/TourDetailsLoading';
import { TourInfoCard } from './tourDetails/TourInfoCard';
import { TourShowsTable } from './tourDetails/TourShowsTable';
import { TourStandingsTable } from './tourDetails/TourStandingsTable';

export function TourDetailsPage() {
    const { tourId } = useParams<{ tourId: string }>();
    const { user } = useAuth();
    const { loading, gameShows, tourInfo, tourStats, standings } = useTourDetails(tourId);

    return (
        <div className="max-w-[1280px] mx-auto">
            <TourDetailsBreadcrumbs tourName={tourInfo?.tour} />

            {loading ? (
                <TourDetailsLoading />
            ) : (
                <div className="space-y-4">
                    <TourInfoCard
                        tourName={tourInfo?.tour}
                        totalShows={tourStats.totalShows}
                        totalPlayers={tourStats.totalPlayers}
                        tourWinners={tourStats.tourWinners}
                    />

                    <TourShowsTable gameShows={gameShows} />

                    <TourStandingsTable standings={standings} currentUserId={user?.id} />
                </div>
            )}
        </div>
    );
}