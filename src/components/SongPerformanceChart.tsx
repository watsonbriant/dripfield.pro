import React from 'react';
import PerformanceChart from './PerformanceChart';
import { Performance } from '../types/song';

interface SongPerformanceChartProps {
  performances: Performance[];
  selectedGroup: string | null;
  songName: string;
}

export function SongPerformanceChart({ performances, selectedGroup, songName }: SongPerformanceChartProps) {
  return (
    <div className="overflow-x-auto">
      {performances.length > 0 ? (
        <PerformanceChart 
          performances={performances} 
          selectedGroup={selectedGroup}
        />
      ) : (
        <div className="bg-primary border border-secondary rounded-lg p-3">
          <p className="text-fifth text-center font-light">
            <span className="font-medium">{songName}</span> hasn't been played live.
          </p>
        </div>
      )}
    </div>
  );
}
