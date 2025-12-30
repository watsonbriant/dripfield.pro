import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { useJotyData } from '../hooks/useJotyData';
import JOTYBadge from './JOTYBadge';
import aatLogo from '../img/AAT.jpg';
import nugsLogo from '../img/NugsColor.png';

// Mapping from full names to short codes for JOTYBadge
const ROUND_NAME_TO_CODE: Record<string, string> = {
  'Jam of the Year': 'JOTY',
  '2nd Place': '2nd',
  'Final Four': 'F4',
  'Elite Eight': 'E8',
  'Sweet 16': 'S16',
  'Round of 32': 'R32',
  'Round of 64': 'R64',
};

interface JotyModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  highlightedEntryId: string | null;
}

export default function JotyModal({
  isOpen,
  onClose,
  year,
  highlightedEntryId
}: JotyModalProps) {
  const { rounds, loading } = useJotyData(isOpen, year);

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

  // Render modal using portal to escape parent container's stacking context
  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[49999]"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: '100dvh'
        }}
      />
      
      {/* Custom Modal - centered in viewport */}
      <div 
        className="fixed inset-0 z-[50000] flex items-center justify-center p-4 pointer-events-none"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: '100dvh'
        }}
      >
        <div className="bg-primary border border-fourth shadow-xl flex flex-col max-w-[650px] w-full max-h-[90vh] pointer-events-auto">
          {/* Fixed Header */}
          <div className="bg-tertiary text-fifth border-b border-fourth flex-shrink-0">
            {/* Header Row */}
            <div className="flex items-center justify-between px-2 py-0.5">
              <h2 className="text-sm font-semibold">Jam of the Year {year}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href="https://www.osirispod.com/podcasts/always-almost-there/" target="_blank" rel="noopener noreferrer">
                  <img src={aatLogo} alt="Always Almost There" className="h-6 w-auto rounded-full hover:shadow-[0_0_0_1px_#3c1e40]" />
                </a>
                <a href="https://www.nugs.net/" target="_blank" rel="noopener noreferrer">
                  <img src={nugsLogo} alt="nugs" className="h-6 w-auto rounded-full hover:shadow-[0_0_0_1px_#3c1e40]" />
                </a>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white rounded border border-fourth bg-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-fifth" />
                </button>
              </div>
            </div>
            {/* Subheader Row */}
            <div className="px-2 pb-1">
              <p className="text-[0.625rem] text-fifth font-light leading-[0.625rem]">
                Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs.
              </p>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
                  <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
                </div>
                <p className="text-fifth mt-4">Loading JOTY data...</p>
              </div>
            ) : rounds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-fifth">No JOTY data found for {year}.</p>
              </div>
            ) : (
              <div className="space-y-4 p-2">
                {rounds.map((round) => (
                  <div key={round.joty_round} className="border border-fourth">
                    {/* Round Header */}
                    <div className="bg-fourth px-2 pt-0.5 pb-1 flex items-center gap-2">
                      <JOTYBadge 
                        round={ROUND_NAME_TO_CODE[round.joty_round] || round.joty_round} 
                        compact={false} 
                      />
                      <span className="text-[0.625rem] bg-primary rounded-lg font-medium px-1 text-fifth">
                        {round.joty_round}
                      </span>
                    </div>
                    
                    {/* Results Table */}
                    {round.results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-max">
                          <tbody>
                            {round.results.map((result) => (
                              <tr
                                key={result.entry_id}
                                className={`text-[0.625rem] transition-colors ${
                                  result.entry_id === highlightedEntryId
                                    ? 'bg-tertiary/80 hover:bg-tertiary/40'
                                    : 'bg-canvas hover:bg-tertiary/40'
                                }`}
                              >
                                <td className="px-2 py-0.5 text-fifth whitespace-nowrap">
                                  <span className="font-medium">{result.entry_song}</span>
                                  {result.entry_short && (
                                    <span className="text-red-600 ml-2 font-medium">[{result.entry_short}]</span>
                                  )}
                                </td>
                                <td className="px-2 py-0.5 text-fifth font-medium whitespace-nowrap text-center">
                                  {result.show_date ? formatInTimeZone(
                                    new Date(result.show_date),
                                    'UTC',
                                    'MM.dd.yy'
                                  ) : ''}
                                </td>
                                <td className="px-2 py-0.5 text-fifth font-light whitespace-nowrap">
                                  {result.show_venue_location}
                                  {result.show_subvenue && (() => {
                                    const subvenue = result.show_subvenue;
                                    const startsWithBracket = subvenue.startsWith('(') || subvenue.startsWith('[');
                                    const endsWithBracket = subvenue.endsWith(')') || subvenue.endsWith(']');
                                    const needsWrapping = !startsWithBracket && !endsWithBracket;
                                    
                                    return (
                                      <span className="text-fifth/70 pl-2">
                                        {needsWrapping ? ` (${subvenue})` : ` ${subvenue}`}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-2 py-2 text-center text-fifth text-xs">
                        No entries for this round
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Fixed Footer with JOTYoftheYear.com button */}
          <div className="border-t border-fourth px-2 py-0.5 bg-tertiary text-fifth flex justify-center flex-shrink-0">
            <a
              href={`https://aatgoosepod.com/past-brackets/${year}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-canvas hover:bg-primary text-fifth font-medium py-0.5 px-2 rounded border border-fourth transition-colors text-sm"
            >
              JOTYoftheYear.com
            </a>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

