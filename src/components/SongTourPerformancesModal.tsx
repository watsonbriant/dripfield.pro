import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Custom Modal - centered in viewport */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex items-center justify-between px-0.5 py-0.5 bg-tertiary text-fifth">
            <div className="flex items-center flex-1">
                <h2 className="text-sm font-semibold ml-1.5 mr-4">{songName}</h2>
                {tourName && (
                <span className="text-xs font-medium bg-canvas text-fifth px-2 py-0.5 rounded border border-fourth whitespace-nowrap mr-4">
                    {tourName}
                </span>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4 text-fifth" />
            </button>
        </div>
        
        <div>
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
        <div className="border-t border-fourth px-2 py-0.5 bg-tertiary text-fifth flex justify-center">
          <button
            onClick={() => {
              if (songId) {
                navigate(`/song/${songId}`);
                onClose();
              }
            }}
            className="bg-canvas hover:bg-primary text-fifth font-medium py-0.5 px-2 rounded border border-fourth transition-colors text-sm"
          >
            Song History
          </button>
        </div>
        </div>
      </div>
    </>
  );
}