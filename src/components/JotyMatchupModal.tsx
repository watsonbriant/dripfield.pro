import React from 'react';
import { X } from 'lucide-react';

interface Team {
  seed: number;
  name: string;
  percentage: number;
  entryId?: string;
  date?: string;
  venue?: string;
  entryShort?: string | null; 
}

interface JotyMatchupModalProps {
  isOpen: boolean;
  onClose: () => void;
  team1: Team;
  team2: Team;
  regionColor: string;
  team1Color?: string;  // Add optional specific colors
  team2Color?: string;
}

export default function JotyMatchupModal({ 
  isOpen, 
  onClose, 
  team1, 
  team2,
  regionColor,
  team1Color,
  team2Color
}: JotyMatchupModalProps) {
  if (!isOpen) return null;

  // Use specific colors if provided, otherwise use regionColor
  const team1DisplayColor = team1Color || regionColor;
  const team2DisplayColor = team2Color || regionColor;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-black shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black/10 bg-canvas rounded-t-lg">
          <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">Matchup Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-black bg-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Team 1 */}
            <div className={`bg-canvas border border-black/50 rounded-lg p-4 ${team1.percentage > team2.percentage ? 'ring-2 ring-[#f9ae37]' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team1DisplayColor} w-9 text-center text-white py-1 rounded font-semibold`}>
                    {team1.seed}
                </span>
                <h3 className="text-lg font-semibold text-black flex items-center">
                    <span>{team1.name}</span>
                    {team1.entryShort && (
                    <span className="text-red-600 ml-2 text-base">[{team1.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-2xl font-bold text-black">{team1.percentage}%</span>
            </div>
            {team1.date && (
              <div className="text-sm text-black space-y-1">
                <p><span className="font-semibold">Date:</span> {team1.date}</p>
                <p><span className="font-semibold">Venue:</span> {team1.venue}</p>
              </div>
            )}
          </div>

          {/* Team 2 */}
            <div className={`bg-canvas border border-black/50 rounded-lg p-4 ${team2.percentage > team1.percentage ? 'ring-2 ring-[#f9ae37]' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team2DisplayColor} w-9 text-center text-white py-1 rounded font-semibold`}>
                    {team2.seed}
                </span>
                <h3 className="text-lg font-semibold text-black flex items-center">
                    <span>{team2.name}</span>
                    {team2.entryShort && (
                    <span className="text-red-600 ml-2 text-base">[{team2.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-2xl font-bold text-black">{team2.percentage}%</span>
            </div>
            {team2.date && (
              <div className="text-sm text-black space-y-1">
                <p><span className="font-semibold">Date:</span> {team2.date}</p>
                <p><span className="font-semibold">Venue:</span> {team2.venue}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}