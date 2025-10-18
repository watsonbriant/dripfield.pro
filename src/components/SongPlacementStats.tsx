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
      <div className="bg-primary border border-secondary rounded-lg p-3">
        <SongPlacementPill placementStats={placementStats} />
      </div>
    </div>
  );
}
