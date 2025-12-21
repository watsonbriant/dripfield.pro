import { createPortal } from 'react-dom';
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
}

export default function SetlistModal({
    isOpen,
    onClose,
    setlistUrl,
    showData,
    setlist,
    changes,
    error
}: SetlistModalProps) {
    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[50000] p-8 overflow-y-auto min-h-screen"
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                minHeight: '100dvh' // Dynamic viewport height for better mobile support
            }}
            onClick={onClose}
        >
            <div
                className="relative bg-primary overflow-hidden border border-fourth my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row">
                    {/* Left side - Setlist Scan */}
                    <div className="bg-primary border-b-2 md:border-b-0 md:border-r-2 border-fourth flex flex-col">
                        <h2 className="text-sm font-semibold bg-tertiary text-fifth px-2 py-0.5 w-full border-b border-fourth">Setlist Scan</h2>
                        <div className="rounded flex justify-center">
                            <img
                                src={setlistUrl}
                                alt="Setlist"
                                className="max-h-[500px] md:max-h-[500px] object-contain"
                                onError={(e) => {
                                    console.error('Error loading setlist image');
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Right side - Actual Setlist */}
                    <div className="w-full md:w-[400px] bg-canvas flex flex-col">
                        <h2 className="text-sm font-semibold bg-tertiary text-fifth px-2 py-0.5 w-full border-b border-fourth">Actual Setlist</h2>
                        <div>

                        {/* Show details */}
                        <div className="px-2 py-1 text-fifth">
                            <div className="font-medium text-sm">{showData.show_group}</div>
                            <div className="font-medium text-xs">{formatInTimeZone(new Date(showData.show_date), 'UTC', 'MMMM d, yyyy')}</div>
                            <div className="font-normal text-xs">{showData.show_subvenue}</div>
                            <div className="font-light text-xs">{showData.show_venue_location}</div>
                        </div>

                        {/* Setlist */}
                        <div className="bg-primary py-1 border-y border-fourth">
                            <SetlistDisplay setlist={setlist} />
                        </div>

                        {/* Set Changes */}
                        <h2 className="text-sm font-semibold bg-tertiary text-fifth px-2 py-0.5 w-full border-b border-fourth">Setlist Changes</h2>
                        <div className="bg-primary py-1 px-2">
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
                                <div className="space-y-0.5">
                                    {changes.map((change, index) => {
                                        const { icon } = getChangeIcon(change.change_type);
                                        return (
                                            <div 
                                                key={change.show_change_uuid} 
                                                className={`flex items-center gap-2 ${index !== 0 ? '' : ''}`}
                                            >
                                                <div className="flex-shrink-0">
                                                    {icon}
                                                </div>
                                                <div className="text-fifth text-[0.625rem] [&_a]:font-medium font-light">
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
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-white border border-fourth p-[1px] transition-colors"
                >
                    <X className="w-4 h-4 text-fifth" />
                </button>
            </div>
        </div>
    );

    // Use portal to render modal at document body level
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    
    return null;
}
