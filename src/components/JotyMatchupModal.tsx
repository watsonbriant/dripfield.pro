import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Team {
  seed: number;
  name: string;
  percentage: number;
  entryId?: string;
  date?: string;
  venue?: string;
  entryShort?: string | null; 
  subvenue?: string | null;
  fullDate?: string;
  songId?: string | null;
  showId?: string | null;
  venueId?: string | null;
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
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  // Clean song names for display - same function as in Tours component
  const cleanSongName = (songName: string): string => {
    return songName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
      .replace(/–/g, '-')
      .replace(/…/g, '...')
      .replace(/∆/g, 'a');
  };

  // Navigation handlers
  const handleSongClick = (songId: string | null) => {
    if (songId) {
      navigate(`/song/${songId}`);
    }
  };

  const handleShowClick = (showId: string | null) => {
    if (showId) {
      navigate(`/setlist/${showId}`);
    }
  };

  const handleVenueClick = (venueId: string | null) => {
    if (venueId) {
      navigate(`/venue/${venueId}`);
    }
  };

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
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-secondary/10 bg-canvas rounded-t-lg">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary">Matchup Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>
        
        <div className="p-3 space-y-4">
          {/* Team 1 */}
            <div className={`bg-canvas border border-secondary/50 rounded-lg p-3 ${team1.percentage > team2.percentage ? 'ring-2 ring-tertiary' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team1DisplayColor} w-9 text-center text-primary py-1 rounded font-semibold`}>
                    {team1.seed}
                </span>
                <h3 className="font-trad text-[1.375rem] leading-[1.5rem] text-fifth pb-0.5 flex items-center">
                    <span 
                      className={`${team1.songId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleSongClick(team1.songId)}
                    >
                      {cleanSongName(team1.name)}
                    </span>
                    {team1.entryShort && (
                    <span className="text-red-600 ml-2 text-base font-[Rubik] font-[500] text-sm pt-1 pl-1">[{team1.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-2xl font-semibold text-fifth">{team1.percentage}%</span>
            </div>
            {team1.fullDate && (
                <div className="text-sm text-fifth">
                <p 
                  className={`font-semibold text-base ${team1.showId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                  onClick={() => handleShowClick(team1.showId)}
                >
                  {team1.fullDate}
                </p>
                {team1.subvenue ? (
                    <>
                    <p 
                      className={`mt-1 font-medium ${team1.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleVenueClick(team1.venueId)}
                    >
                      {team1.subvenue}
                    </p>
                    <p className="font-light">{team1.venue}</p>
                    </>
                ) : (
                    <p 
                      className={`font-light ${team1.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleVenueClick(team1.venueId)}
                    >
                      {team1.venue}
                    </p>
                )}
                </div>
            )}
            </div>

            {/* Team 2 */}
            <div className={`bg-canvas border border-secondary/50 rounded-lg p-3 ${team2.percentage > team1.percentage ? 'ring-2 ring-tertiary' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team2DisplayColor} w-9 text-center text-primary py-1 rounded font-semibold`}>
                    {team2.seed}
                </span>
                <h3 className="font-trad text-[1.375rem] leading-[1.5rem] text-fifth pb-0.5 flex items-center">
                    <span 
                      className={`${team2.songId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleSongClick(team2.songId)}
                    >
                      {cleanSongName(team2.name)}
                    </span>
                    {team2.entryShort && (
                    <span className="text-red-600 ml-2 text-base font-[Rubik] font-[500] text-sm pt-1 pl-1">[{team2.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-2xl font-semibold text-fifth">{team2.percentage}%</span>
            </div>
            {team2.fullDate && (
                <div className="text-sm text-fifth">
                <p 
                  className={`font-semibold text-base ${team2.showId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                  onClick={() => handleShowClick(team2.showId)}
                >
                  {team2.fullDate}
                </p>
                {team2.subvenue ? (
                    <>
                    <p 
                      className={`mt-1 font-medium ${team2.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleVenueClick(team2.venueId)}
                    >
                      {team2.subvenue}
                    </p>
                    <p className="font-light">{team2.venue}</p>
                    </>
                ) : (
                    <p 
                      className={`font-light ${team2.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleVenueClick(team2.venueId)}
                    >
                      {team2.venue}
                    </p>
                )}
                </div>
            )}
            </div>
        </div>
      </div>
    </>
  );
}