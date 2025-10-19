import React from 'react';

export function SetlistGameLoading() {
  return (
    <div className="text-center py-12 bg-primary border border-secondary rounded-lg p-3">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
      </div>
      <p className="text-fifth mt-4">Loading setlist games...</p>
    </div>
  );
}