import React from 'react';
import { Save, Edit, Plus } from 'lucide-react';
import { ShowData } from '../types/showTypes';
import { formatDate } from '../utils/showUtils';
import { AdminShowDropdown } from './AdminShowDropdown';

interface AdminShowHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredShows: ShowData[];
    onShowSelect: (show: ShowData) => void;
    loading: boolean;
    loadingProgress: number;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    onOpenNewShowModal: () => void;
    selectedShow: ShowData | null;
    isEditing: boolean;
    isSubmitting: boolean;
    onToggleEdit: () => void;
}

export const AdminShowHeader: React.FC<AdminShowHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    filteredShows,
    onShowSelect,
    loading,
    loadingProgress,
    isDropdownOpen,
    setIsDropdownOpen,
    onOpenNewShowModal,
    selectedShow,
    isEditing,
    isSubmitting,
    onToggleEdit
}) => {
    return (
        <>
            {/* Header with buttons and dropdown */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold bg-fourth text-white text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">Show Management</h3>

                <div className="flex items-center gap-2">
                    {/* Add New Show button */}
                    <button
                        onClick={onOpenNewShowModal}
                        className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-fourth hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-white"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Show Dropdown */}
                    <AdminShowDropdown
                        isOpen={isDropdownOpen}
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filteredShows={filteredShows}
                        onShowSelect={onShowSelect}
                        loading={loading}
                        loadingProgress={loadingProgress}
                    />
                </div>
            </div>

            {/* Show details section header */}
            {selectedShow && (
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg text-fifth font-medium">
                        {formatDate(selectedShow.show_date)} - {selectedShow.show_subvenue}
                    </h4>
                    <button
                        onClick={onToggleEdit}
                        disabled={isSubmitting}
                        className="px-2 py-1.5 font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-fourth text-white border-fourth hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                        {isEditing ? (
                            <>
                                <Save className="w-4 h-4" />
                                Save
                            </>
                        ) : (
                            <>
                                <Edit className="w-4 h-4" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
            )}
        </>
    );
};
