import React from 'react';
import { Plus } from 'lucide-react';
import { ReleaseShow } from '../types/showTypes';

interface ReleasesTableProps {
    showReleases: ReleaseShow[];
    loadingReleases: boolean;
    onAddRelease: () => void;
    onEditRelease: (releaseId: string, order: number) => void;
}

export const ReleasesTable: React.FC<ReleasesTableProps> = ({
    showReleases,
    loadingReleases,
    onAddRelease,
    onEditRelease
}) => {
    return (
        <div className="mt-6 space-y-1">
            <div className="flex justify-between items-center">
                <h4 className="text-base text-fifth font-medium">Releases</h4>
                <button
                    onClick={onAddRelease}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white border border-fourth rounded-lg text-sm hover:bg-green-600/80 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Release
                </button>
            </div>
            
            {loadingReleases ? (
                <div className="flex justify-center items-center p-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-fourth"></div>
                    <p className="text-sm text-fifth/70 ml-2">Loading releases...</p>
                </div>
            ) : showReleases.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-canvas border-y border-secondary/10">
                                <th className="px-4 py-1 text-left text-sm font-medium text-fifth">Display Name</th>
                                <th className="px-4 py-1 text-left text-sm font-medium text-fifth">Service</th>
                                <th className="px-4 py-1 text-center text-sm font-medium text-fifth">Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {showReleases.map((releaseShow, index) => (
                                <tr 
                                    key={releaseShow.release_id}
                                    onClick={() => onEditRelease(releaseShow.release_id, releaseShow.release_order)}
                                    className={`${
                                        index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                                    } hover:bg-tertiary/40 transition-colors cursor-pointer`}
                                >
                                    <td className="px-4 py-1 text-xs font-light text-fifth">
                                        {releaseShow.releases.release_displayname}
                                    </td>
                                    <td className="px-4 py-1 text-xs font-light text-fifth">
                                        {releaseShow.releases.release_service || '-'}
                                    </td>
                                    <td className="px-4 py-1 text-xs font-light text-fifth text-center">
                                        {releaseShow.release_order}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-sm text-fifth/80 italic p-3 bg-canvas rounded-md border border-secondary/10">
                    No releases associated with this show
                </div>
            )}
        </div>
    );
};
