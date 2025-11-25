import React from 'react';
import SongPlacementPill from './SongPlacementPill';
import { PlacementStat } from '../types/song';

interface SongPlacementStatsProps {
  placementStats: PlacementStat[];
}

export function SongPlacementStats({ placementStats }: SongPlacementStatsProps) {
  if (placementStats.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div className="bg-primary border border-fourth">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <h3 className="text-sm font-semibold">Set Placements</h3>
        </div>
        <div className="p-2">
          <SongPlacementPill placementStats={placementStats} />
        </div>
      </div>
    </div>
  );
}
