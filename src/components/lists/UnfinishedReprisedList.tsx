import React, { useState } from 'react';
import SeguePerformancesModal from './SeguePerformancesModal';
import { UnfinishedTable, SandwichTable } from './shared/UnfinishedReprisedTableComponents';
import { useUnfinishedReprisedData } from './shared/UnfinishedReprisedDataHooks';

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
            <div className="hidden md:grid md:grid-cols-2">
                {/* Container 1 */}
                <div className="border-r border-fourth">
                    <h3 className="text-sm font-medium text-white mb-1 px-2 py-0.5 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-[0.625rem] px-2 leading-[0.75rem] mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    <UnfinishedTable items={container1Data} />
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-sm font-medium text-white mb-1 px-2 py-0.5 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-[0.625rem] px-2 leading-[0.75rem] mb-2">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    <SandwichTable 
                        sandwiches={container2Data} 
                        onOpenSandwichModal={openSandwichModal}
                    />
                </div>
            </div>

            {/* Mobile view - stacked vertically */}
            <div className="md:hidden">
                {/* Container 1 */}
                <div className="border-b border-fourth">
                    <h3 className="text-sm font-medium text-white mb-1 px-2 py-0.5 bg-fifth">
                        Most Common Unfinished
                    </h3>
                    <p className="text-fifth font-light text-[0.625rem] px-2 leading-[0.75rem] mb-2">
                        Songs that were left unfinished, either by ending completely or segueing into another song, regardless if they were reprised/finished later in the show.
                    </p>
                    <UnfinishedTable items={container1Data} />
                </div>

                {/* Container 2 */}
                <div>
                    <h3 className="text-sm font-medium text-white mb-1 px-2 py-0.5 bg-fifth">
                        Most Common Reprises
                    </h3>
                    <p className="text-fifth font-light text-[0.625rem] px-2 leading-[0.75rem] mb-2 mt-1">
                        Songs that were unfinished and then reprised later in the same set, including all songs played between them.
                    </p>
                    <SandwichTable 
                        sandwiches={container2Data} 
                        onOpenSandwichModal={openSandwichModal}
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