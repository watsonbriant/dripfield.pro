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
      {/* Modal */}
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 pointer-events-none">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="px-0.5 py-0.5 bg-tertiary text-fifth flex justify-between items-center">
            <h2 className="text-sm font-semibold ml-1.5 mr-4">Matchup Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-fifth" />
            </button>
          </div>
          
          <div className="p-2 space-y-2">
          {/* Team 1 */}
            <div className={`bg-primary border border-fourth p-2 ${team1.percentage > team2.percentage ? 'bg-tertiary/40' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team1DisplayColor} text-white px-2 py-0.5 rounded font-medium text-xs`}>
                    {team1.seed}
                </span>
                <h3 className="font-medium text-xs text-fifth flex items-center">
                    <span 
                      className={`${team1.songId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleSongClick(team1.songId)}
                    >
                      {team1.name}
                    </span>
                    {team1.entryShort && (
                    <span className="text-red-600 ml-2 text-[0.625rem] font-medium">[{team1.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-xs font-medium text-fifth">{team1.percentage}%</span>
            </div>
            {team1.fullDate && (
                <div className="text-[0.625rem] text-fifth">
                <p 
                  className={`font-medium ${team1.showId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                  onClick={() => handleShowClick(team1.showId)}
                >
                  {team1.fullDate}
                </p>
                {team1.subvenue ? (
                    <>
                    <p 
                      className={`mt-1 font-light ${team1.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
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
            <div className={`bg-primary border border-fourth p-2 ${team2.percentage > team1.percentage ? 'bg-tertiary/40' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                <span className={`${team2DisplayColor} text-white px-2 py-0.5 rounded font-medium text-xs`}>
                    {team2.seed}
                </span>
                <h3 className="font-medium text-xs text-fifth flex items-center">
                    <span 
                      className={`${team2.songId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                      onClick={() => handleSongClick(team2.songId)}
                    >
                      {team2.name}
                    </span>
                    {team2.entryShort && (
                    <span className="text-red-600 ml-2 text-[0.625rem] font-medium">[{team2.entryShort}]</span>
                    )}
                </h3>
                </div>
                <span className="text-xs font-medium text-fifth">{team2.percentage}%</span>
            </div>
            {team2.fullDate && (
                <div className="text-[0.625rem] text-fifth">
                <p 
                  className={`font-medium ${team2.showId ? 'cursor-pointer hover:underline transition-all' : ''}`}
                  onClick={() => handleShowClick(team2.showId)}
                >
                  {team2.fullDate}
                </p>
                {team2.subvenue ? (
                    <>
                    <p 
                      className={`mt-1 font-light ${team2.venueId ? 'cursor-pointer hover:underline transition-all' : ''}`}
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
      </div>
    </>
  );
}