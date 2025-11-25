import React, { useState } from 'react';
import SeguePerformancesModal from './SeguePerformancesModal';
import { SegueTable } from './shared/SegueTableComponents';
import { useSegueData } from './shared/SegueDataHooks';

interface SeguesListProps {
    listId: string;
    onProgressUpdate: (progress: number) => void;
}

export function SeguesList({ listId, onProgressUpdate }: SeguesListProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [segueModalData, setSegueModalData] = useState<{
        isOpen: boolean;
        sourceSongName: string;
        destinationSongName: string;
    }>({
        isOpen: false,
        sourceSongName: '',
        destinationSongName: ''
    });

    const { loading, segueData } = useSegueData(listId, onProgressUpdate);

    const toggleExpanded = (segue: any) => {
        const newExpanded = new Set(expandedRows);
        
        if (newExpanded.has(segue.segue_key)) {
            newExpanded.delete(segue.segue_key);
        } else {
            newExpanded.add(segue.segue_key);
        }
        
        setExpandedRows(newExpanded);
    };

    const openSegueModal = (sourceSongName: string, destinationSongName: string) => {
        setSegueModalData({
            isOpen: true,
            sourceSongName,
            destinationSongName
        });
    };

    if (loading) {
        return (
            <div className="text-fifth text-center py-8">Loading data...</div>
        );
    }

    return (
        <div>
            <div>
                <h3 className="text-sm font-medium text-white mb-1 px-2 py-0.5 bg-fifth">
                    Most Common Segues
                </h3>
                <p className="text-fifth font-light text-[0.625rem] px-2 leading-[0.75rem] mb-2">
                    Songs that segued into another song, ordered by frequency.
                </p>
                <SegueTable
                    segues={segueData}
                    expandedRows={expandedRows}
                    onToggleExpanded={toggleExpanded}
                    onOpenSegueModal={openSegueModal}
                />
            </div>
            <SeguePerformancesModal
                isOpen={segueModalData.isOpen}
                onClose={() => setSegueModalData({ isOpen: false, sourceSongName: '', destinationSongName: '' })}
                sourceSongName={segueModalData.sourceSongName}
                destinationSongName={segueModalData.destinationSongName}
            />
        </div>
    );
}