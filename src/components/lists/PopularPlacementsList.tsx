import { PlacementSection } from './shared/PlacementTableComponents';
import { usePlacementData } from './shared/PlacementDataHooks';

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
            <div className="hidden md:grid md:grid-cols-2">
                <div className="border-r border-b border-fourth">
                    <PlacementSection 
                        title="Top Show Openers" 
                        bgColor="#047857" 
                        songs={showOpeners} 
                    />
                </div>
                <div className="border-b border-fourth">
                    <PlacementSection 
                        title="Top Set Openers" 
                        bgColor="#10b981" 
                        songs={setOpeners} 
                    />
                </div>
                <div className="border-r border-fourth">
                    <PlacementSection 
                        title="Top Set Closers" 
                        bgColor="#3b82f6" 
                        songs={setClosers} 
                    />
                </div>
                <div>
                    <PlacementSection 
                        title="Top Encores" 
                        bgColor="#be123c" 
                        songs={encores} 
                    />
                </div>
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden">
                <div className="border-b border-fourth">
                    <PlacementSection 
                        title="Top Show Openers" 
                        bgColor="#047857" 
                        songs={showOpeners} 
                    />
                </div>
                <div className="border-b border-fourth">
                    <PlacementSection 
                        title="Top Set Openers" 
                        bgColor="#10b981" 
                        songs={setOpeners} 
                    />
                </div>
                <div className="border-b border-fourth">
                    <PlacementSection 
                        title="Top Set Closers" 
                        bgColor="#3b82f6" 
                        songs={setClosers} 
                    />
                </div>
                <div>
                    <PlacementSection 
                        title="Top Encores" 
                        bgColor="#be123c" 
                        songs={encores} 
                    />
                </div>
            </div>
        </div>
    );
}