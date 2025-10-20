import { X } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import SetlistDisplay from './SetlistDisplay';
import { ShowChange, SetlistEntry, ShowData } from '../types/showChanges';
import { getChangeIcon, renderChangeText } from '../utils/showChangesHelpers';

interface SetlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    setlistUrl: string;
    showData: ShowData;
    setlist: SetlistEntry[];
    changes: ShowChange[];
    error: string | null;
    navigate: any;
}

export default function SetlistModal({
    isOpen,
    onClose,
    setlistUrl,
    showData,
    setlist,
    changes,
    error,
    navigate
}: SetlistModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto min-h-screen"
            style={{ 
                position: 'fixed',
                top: -24,
                left: 0,
                right: 0,
                bottom: 0,
                minHeight: '100dvh' // Dynamic viewport height for better mobile support
            }}
            onClick={onClose}
        >
            <div
                className="relative bg-primary rounded-lg overflow-hidden border-2 border-secondary my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row">
                    {/* Left side - Setlist Scan */}
                    <div className="p-4 bg-primary border-b-2 md:border-b-0 md:border-r-2 border-secondary flex flex-col items-center">
                        <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Setlist Scan</h2>
                        <div className="pt-4 rounded flex justify-center">
                            <img
                                src={setlistUrl}
                                alt="Setlist"
                                className="rounded-lg max-h-[500px] md:max-h-[500px] object-contain border border-secondary"
                                onError={(e) => {
                                    console.error('Error loading setlist image');
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Right side - Actual Setlist */}
                    <div className="w-full md:w-[400px] p-3 bg-canvas flex flex-col">
                        <div className="flex justify-center mb-4">
                            <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Actual Setlist</h2>
                        </div>

                        {/* Show details */}
                        <div className="text-fifth mb-2">
                            <div className="font-medium text-lg">{showData.show_group}</div>
                            <div className="font-medium">{formatInTimeZone(new Date(showData.show_date), 'UTC', 'MMMM d, yyyy')}</div>
                            <div className="font-normal">{showData.show_subvenue}</div>
                            <div className="font-light mb-2">{showData.show_venue_location}</div>
                        </div>

                        {/* Setlist */}
                        <div className="bg-primary p-3 rounded-lg border border-secondary mb-4">
                            <SetlistDisplay setlist={setlist} navigate={navigate} />
                        </div>

                        {/* Set Changes */}
                        <div className="flex justify-center mb-2 mt-2">
                            <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-3 py-1 rounded-lg border border-secondary">Setlist Changes</h2>
                        </div>
                        <div className="mt-2 bg-primary p-3 rounded-lg border border-secondary">
                            {error && (
                                <div className="text-red-400 text-xs mb-2">
                                    {error}
                                </div>
                            )}
                            {changes.length === 0 ? (
                                <div className="text-fifth text-xs">
                                    No changes from original setlist.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {changes.map((change, index) => {
                                        const { icon } = getChangeIcon(change.change_type);
                                        return (
                                            <div 
                                                key={change.show_change_uuid} 
                                                className={`flex items-center gap-2 ${index !== 0 ? 'pt-1 border-t border-[#d8d7d7]' : ''}`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {icon}
                                                </div>
                                                <div className="text-fifth text-xs [&_a]:font-medium font-light">
                                                    {renderChangeText(change.change)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-tertiary border border-secondary rounded-lg p-2 transition-colors"
                >
                    <X className="w-5 h-5 text-fifth" />
                </button>
            </div>
        </div>
    );
}
