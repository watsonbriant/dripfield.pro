import React, { useState } from 'react';
import ShowModal from './ShowModal';
import { ShowReleaseModal } from './ShowReleaseModal';
import { ShowFormFields } from './ShowFormFields';
import { ReleasesTable } from './ReleasesTable';
import { AdminShowHeader } from './AdminShowHeader';
import { useShowData } from '../hooks/useShowData';
import { useShowReleases } from '../hooks/useShowReleases';
import { useShowActions } from '../hooks/useShowActions';
import { useShowModals } from '../hooks/useShowModals';
import { ShowData } from '../types/showTypes';
import { formatDate } from '../utils/showUtils';

export const AdminShow: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Custom hooks
    const { allShows, loading, loadingProgress, groups, tours, subvenues, years, songs, fetchAllShows } = useShowData();
    const { showReleases, loadingReleases, fetchShowReleases } = useShowReleases();
    const { selectedShow, isEditing, editedShow, isSubmitting, handleShowSelect, handleInputChange, toggleEdit } = useShowActions(allShows, fetchAllShows);
    const {
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
    } = useShowModals();

    // Filtered shows for dropdown
    const filteredShows = React.useMemo(() => {
        return allShows.filter(show => {
            const searchLower = searchTerm.toLowerCase();
            const dateStr = formatDate(show.show_date);
            return (
                dateStr.includes(searchLower) ||
                show.show_canonid?.toString().includes(searchLower) ||
                show.show_group.toLowerCase().includes(searchLower) ||
                show.show_venue_location?.toLowerCase().includes(searchLower) ||
                show.show_subvenue.toLowerCase().includes(searchLower)
            );
        });
    }, [allShows, searchTerm]);

    // Enhanced handlers that work with hooks
    const handleShowSelectWithReleases = (show: ShowData) => {
        handleShowSelect(show, fetchShowReleases);
        setIsDropdownOpen(false);
        setSearchTerm('');
    };

    const handleShowModalSaveWithFetch = () => {
        handleShowModalSave(fetchAllShows);
    };

    const handleReleaseModalSaveWithFetch = () => {
        if (selectedShow) {
            handleReleaseModalSave(selectedShow, fetchShowReleases);
        }
    };

    return (
        <div>
            <AdminShowHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredShows={filteredShows}
                onShowSelect={handleShowSelectWithReleases}
                loading={loading}
                loadingProgress={loadingProgress}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                onOpenNewShowModal={handleOpenNewShowModal}
                selectedShow={selectedShow}
                isEditing={isEditing}
                isSubmitting={isSubmitting}
                onToggleEdit={toggleEdit}
            />

            {selectedShow && (
                <div>
                    <ShowFormFields
                        editedShow={editedShow}
                        isEditing={isEditing}
                        onInputChange={handleInputChange}
                        groups={groups}
                        tours={tours}
                        subvenues={subvenues}
                        years={years}
                        selectedShow={selectedShow}
                        allShows={allShows}
                        songs={songs}
                    />

                    <ReleasesTable
                        showReleases={showReleases}
                        loadingReleases={loadingReleases}
                        onAddRelease={handleAddRelease}
                        onEditRelease={handleEditRelease}
                    />
                </div>
            )}

            <ShowModal
                isOpen={isShowModalOpen}
                onClose={closeShowModal}
                show={selectedShow}
                onSave={handleShowModalSaveWithFetch}
                isNewShow={isNewShow}
                groups={groups}
                tours={tours}
                subvenues={subvenues}
                years={years}
            />

            {selectedShow && (
                <ShowReleaseModal
                    isOpen={isReleaseModalOpen}
                    onClose={handleReleaseModalClose}
                    onSave={handleReleaseModalSaveWithFetch}
                    showId={selectedShow.show_id}
                    mode={releaseModalMode}
                    existingReleaseId={selectedReleaseForEdit?.releaseId}
                    existingOrder={selectedReleaseForEdit?.order}
                />
            )}
        </div>
    );
};

export default AdminShow;