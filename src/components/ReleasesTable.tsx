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
        <div className="mt-2">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm text-fifth font-medium">Releases</h4>
                <button
                    onClick={onAddRelease}
                    className="flex items-center gap-1 px-2 py-0.5 bg-fourth text-white border border-fourth hover:bg-fourth/80 transition-colors text-xs font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Release
                </button>
            </div>
            
            {loadingReleases ? (
                <div className="flex justify-center items-center p-3">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                        <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                        <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                    </div>
                    <p className="text-xs text-fifth ml-2">Loading releases...</p>
                </div>
            ) : showReleases.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-canvas border-y border-fourth/10">
                                <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth">Display Name</th>
                                <th className="px-2 py-0.5 text-left text-xs font-medium text-fifth">Service</th>
                                <th className="px-2 py-0.5 text-center text-xs font-medium text-fifth">Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {showReleases.map((releaseShow, index) => (
                                <tr 
                                    key={releaseShow.release_id}
                                    onClick={() => onEditRelease(releaseShow.release_id, releaseShow.release_order)}
                                    className={`${
                                        index % 2 === 0 ? 'bg-primary' : 'bg-primary'
                                    } hover:bg-tertiary/40 transition-colors cursor-pointer text-[0.625rem]`}
                                >
                                    <td className="px-2 font-light text-fifth">
                                        {releaseShow.releases.release_displayname}
                                    </td>
                                    <td className="px-2 font-light text-fifth">
                                        {releaseShow.releases.release_service || '-'}
                                    </td>
                                    <td className="px-2 font-light text-fifth text-center">
                                        {releaseShow.release_order}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-xs text-fifth bg-primary border border-fourth p-3 text-center">
                    No releases associated with this show
                </div>
            )}
        </div>
    );
};
