import { PlacementSection } from './shared/PlacementTableComponents';
import { usePlacementData, cleanSongName } from './shared/PlacementDataHooks';

interface PopularPlacementsListProps {
    listId: string;
    onProgressUpdate: (progress: number) => void;
}

export function PopularPlacementsList({ listId, onProgressUpdate }: PopularPlacementsListProps) {
    const { loading, showOpeners, setOpeners, setClosers, encores } = usePlacementData(listId, onProgressUpdate);


    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading placements...</div>
        );
    }

    return (
        <div>
            {/* Desktop view - 2x2 grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
                <PlacementSection 
                    title="Top Show Openers" 
                    bgColor="#047857" 
                    songs={showOpeners} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Set Openers" 
                    bgColor="#10b981" 
                    songs={setOpeners} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Set Closers" 
                    bgColor="#3b82f6" 
                    songs={setClosers} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Encores" 
                    bgColor="#be123c" 
                    songs={encores} 
                    cleanSongName={cleanSongName} 
                />
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden space-y-6">
                <PlacementSection 
                    title="Top Show Openers" 
                    bgColor="#047857" 
                    songs={showOpeners} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Set Openers" 
                    bgColor="#10b981" 
                    songs={setOpeners} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Set Closers" 
                    bgColor="#3b82f6" 
                    songs={setClosers} 
                    cleanSongName={cleanSongName} 
                />
                <PlacementSection 
                    title="Top Encores" 
                    bgColor="#be123c" 
                    songs={encores} 
                    cleanSongName={cleanSongName} 
                />
            </div>
        </div>
    );
}