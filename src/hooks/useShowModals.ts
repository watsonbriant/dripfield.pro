import { useState } from 'react';
import { ShowData } from '../types/showTypes';

export const useShowModals = () => {
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [isNewShow, setIsNewShow] = useState(false);
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
    const [releaseModalMode, setReleaseModalMode] = useState<'add' | 'edit'>('add');
    const [selectedReleaseForEdit, setSelectedReleaseForEdit] = useState<{
        releaseId: string;
        order: number;
    } | null>(null);

    const handleOpenNewShowModal = () => {
        setIsNewShow(true);
        setIsShowModalOpen(true);
    };

    const handleShowModalSave = (fetchAllShows: () => void) => {
        fetchAllShows();
        setIsShowModalOpen(false);
    };

    const handleAddRelease = () => {
        setReleaseModalMode('add');
        setSelectedReleaseForEdit(null);
        setIsReleaseModalOpen(true);
    };

    const handleEditRelease = (releaseId: string, order: number) => {
        setReleaseModalMode('edit');
        setSelectedReleaseForEdit({ releaseId, order });
        setIsReleaseModalOpen(true);
    };

    const handleReleaseModalClose = () => {
        setIsReleaseModalOpen(false);
        setSelectedReleaseForEdit(null);
    };

    const handleReleaseModalSave = (selectedShow: ShowData, fetchShowReleases: (showId: string) => void) => {
        fetchShowReleases(selectedShow.show_id);
        handleReleaseModalClose();
    };

    const closeShowModal = () => {
        setIsShowModalOpen(false);
    };

    return {
        isShowModalOpen,
        isNewShow,
        isReleaseModalOpen,
        releaseModalMode,
        selectedReleaseForEdit,
        handleOpenNewShowModal,
        handleShowModalSave,
        handleAddRelease,
        handleEditRelease,
        handleReleaseModalClose,
        handleReleaseModalSave,
        closeShowModal
    };
};
