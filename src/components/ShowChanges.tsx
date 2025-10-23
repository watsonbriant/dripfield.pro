import { useState, useEffect } from 'react';
import { FileMusic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShowChangesProps } from '../types/showChanges';
import { useShowChanges } from '../hooks/useShowChanges';
import SetlistModal from './SetlistModal';
import ChangesList from './ChangesList';


export default function ShowChanges({ showId, className = '', openModal, setOpenModal }: ShowChangesProps) {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const {
        changes,
        setlistUrl,
        setlistRecordExists,
        loading,
        showData,
        setlist,
        error
    } = useShowChanges(showId);

    // Use effect to sync with external control
    useEffect(() => {
        if (openModal !== undefined) {
            setIsModalOpen(openModal);
        }
    }, [openModal]);

    // Update the modal close handler
    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (setOpenModal) {
            setOpenModal(false);
        }
    };

    // Update the modal open handler
    const handleOpenModal = () => {
        setIsModalOpen(true);
        if (setOpenModal) {
            setOpenModal(true);
        }
    };

    // Don't render anything while loading
    if (loading) {
        return null;
    }

    // If no setlist record exists, hide the entire component
    if (!setlistRecordExists) {
        return null;
    }

    // If there's an error and no data, show error state
    if (error && changes.length === 0) {
        return (
            <div className={`bg-primary border border-secondary rounded-lg p-3 text-sm ${className}`}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-medium text-fifth mb-2">
                        Setlist Changes
                    </h2>
                </div>
                <div className="text-red-400 text-xs">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`bg-primary border border-secondary rounded-lg p-3 text-sm ${className}`}>
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth mb-1">
                        Setlist Changes
                    </h2>
                    {setlistUrl && (
                        <button
                            onClick={handleOpenModal}
                            className="bg-tertiary hover:bg-primary border border-secondary rounded p-1.5 transition-colors"
                        >
                            <FileMusic
                                className="h-4 w-4 text-fifth"
                            />
                        </button>
                    )}
                </div>

                {error && (
                    <div className="text-red-400 text-xs mb-2">
                        {error}
                    </div>
                )}

                <ChangesList changes={changes} />
            </div>

            <SetlistModal
                isOpen={isModalOpen && !!setlistUrl && !!showData}
                onClose={handleCloseModal}
                setlistUrl={setlistUrl!}
                showData={showData!}
                setlist={setlist}
                changes={changes}
                error={error}
                navigate={navigate}
            />
        </>
    );
}