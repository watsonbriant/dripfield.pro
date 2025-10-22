import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cleanSongName } from '../utils/songMatrixUtils';
import { useSongPerformances } from '../hooks/useSongPerformances';
import PerformancesTable from './PerformancesTable';
import GuestLegend from './GuestLegend';

interface SongTourPerformancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  songName: string;
  tourId: string;
  currentShowId: string;
}

export default function SongTourPerformancesModal({
  isOpen,
  onClose,
  songName,
  tourId,
  currentShowId: _currentShowId
}: SongTourPerformancesModalProps) {
  const navigate = useNavigate();
  const { performances, loading, tourName, songId, guestGroups, getGuestColor } = useSongPerformances(isOpen, songName, tourId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Custom Modal with 650px max-width on desktop */}
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-secondary bg-canvas rounded-t-lg">
            <div className="flex items-center flex-1">
                <h2 className="text-[1.25rem] leading-[1.25rem] font-trad bg-tertiary text-fifth inline-block px-3 pt-0.5 pb-1.5 rounded-lg border border-secondary mr-4">{cleanSongName(songName)}</h2>
                {tourName && (
                <span className="text-xs font-medium bg-secondary text-fifth px-3 py-1 rounded-full border border-secondary whitespace-nowrap mr-4">
                    {tourName}
                </span>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors flex-shrink-0"
            >
                <X className="w-5 h-5 text-fifth" />
            </button>
        </div>
        
        <div className="p-4">
            <div>
            {loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
                <p className="text-fifth mt-4">Loading performances...</p>
              </div>
            ) : performances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-fifth">No performances found in this tour.</p>
              </div>
            ) : (
              <>
                <PerformancesTable
                  performances={performances}
                  getGuestColor={getGuestColor}
                  onClose={onClose}
                />

                <GuestLegend
                  guestGroups={guestGroups}
                  onClose={onClose}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Footer with Song History button */}
        <div className="border-t border-secondary p-4 bg-canvas rounded-b-lg flex justify-center">
          <button
            onClick={() => {
              if (songId) {
                navigate(`/song/${songId}`);
                onClose();
              }
            }}
            className="bg-tertiary hover:bg-primary text-fifth font-medium py-1 px-3 rounded-lg border border-secondary transition-colors"
          >
            Song History
          </button>
        </div>
      </div>
    </>
  );
}