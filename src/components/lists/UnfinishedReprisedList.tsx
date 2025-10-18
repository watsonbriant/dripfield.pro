import React, { useState } from 'react';
import SeguePerformancesModal from './SeguePerformancesModal';
import { UnfinishedTable, SandwichTable } from './shared/UnfinishedReprisedTableComponents';
import { useUnfinishedReprisedData, cleanSongName } from './shared/UnfinishedReprisedDataHooks';

interface UnfinishedReprisedListProps {
    listId: string;
    onProgressUpdate: (progress: number) => void;
}

export function UnfinishedReprisedList({ listId, onProgressUpdate }: UnfinishedReprisedListProps) {
    const [sandwichModalData, setSandwichModalData] = useState<{
        isOpen: boolean;
        sandwichSongs: string[];
    }>({
        isOpen: false,
        sandwichSongs: []
    });

    const { loading, container1Data, container2Data } = useUnfinishedReprisedData(listId, onProgressUpdate);

    const openSandwichModal = (sandwichSongs: string[]) => {
        setSandwichModalData({
            isOpen: true,
            sandwichSongs
        });
    };


    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading data...</div>
        );
    }

    return (
        <div>
            {/* Desktop view - 2x2 grid */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
                {/* Container 1 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    <UnfinishedTable items={container1Data} cleanSongName={cleanSongName} />
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    <SandwichTable 
                        sandwiches={container2Data} 
                        onOpenSandwichModal={openSandwichModal}
                        cleanSongName={cleanSongName} 
                    />
                </div>
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden space-y-6">
                {/* Container 1 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    <UnfinishedTable items={container1Data} cleanSongName={cleanSongName} />
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-1 rounded-lg border border-secondary inline-block px-3 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-xs mb-2 mt-1">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    <SandwichTable 
                        sandwiches={container2Data} 
                        onOpenSandwichModal={openSandwichModal}
                        cleanSongName={cleanSongName} 
                    />
                </div>
            </div>

            <SeguePerformancesModal
                isOpen={sandwichModalData.isOpen}
                onClose={() => setSandwichModalData({ isOpen: false, sandwichSongs: [] })}
                sourceSongName=""
                destinationSongName=""
                sandwichSongs={sandwichModalData.sandwichSongs}
            />
        </div>
    );
}