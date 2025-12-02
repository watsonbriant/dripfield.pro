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
    <div className="overflow-x-auto shadow-xl">
      {performances.length > 0 ? (
        <PerformanceChart 
          performances={performances} 
          selectedGroup={selectedGroup}
        />
      ) : (
        <div className="bg-primary border border-fourth shadow-xl">
          <div className="bg-tertiary text-fifth px-2 py-0.5">
            <h3 className="text-sm font-semibold">Performance Chart</h3>
          </div>
          <div className="p-2">
            <p className="text-fifth text-center font-light text-[0.625rem]">
              <span className="font-medium">{songName}</span> hasn't been played live.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
