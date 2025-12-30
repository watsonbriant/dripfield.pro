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
            <div className={`pt-2 ${className}`}>
                <div className="bg-fifth text-white px-1 py-0.5 flex justify-between items-center">
                    <h2 className="text-xs font-semibold">
                        Setlist Changes
                    </h2>
                </div>
                <div className="text-red-400 text-[0.625rem] px-2 py-0.5">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={className}>
                <div className="bg-fifth text-white py-0.5 pr-0.5 flex justify-between items-center">
                    <h2 className="text-xs font-semibold pl-1">
                        Setlist Changes
                    </h2>
                    {setlistUrl && (
                        <button
                            onClick={handleOpenModal}
                            className="transition-colors hover:opacity-80"
                        >
                            <FileMusic
                                className="h-4 w-4 bg-tertiary text-fifth rounded p-0.5"
                            />
                        </button>
                    )}
                </div>

                {error && (
                    <div className="text-red-400 text-[0.625rem] px-2 py-0.5">
                        {error}
                    </div>
                )}

                <div className="px-1 py-1">
                    <ChangesList changes={changes} />
                </div>
            </div>

            <SetlistModal
                isOpen={isModalOpen && !!setlistUrl && !!showData}
                onClose={handleCloseModal}
                setlistUrl={setlistUrl!}
                showData={showData!}
                setlist={setlist}
                changes={changes}
                error={error}
            />
        </>
    );
}