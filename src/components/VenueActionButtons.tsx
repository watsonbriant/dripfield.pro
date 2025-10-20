import React from 'react';
import { Save, Edit, Plus } from 'lucide-react';

interface VenueActionButtonsProps {
    isEditing: boolean;
    isSubmitting: boolean;
    isCreatingNew: boolean;
    onToggleEdit: () => void;
    onCancel: () => void;
    onCreateNew: () => void;
}

export const VenueActionButtons: React.FC<VenueActionButtonsProps> = ({
    isEditing,
    isSubmitting,
    isCreatingNew,
    onToggleEdit,
    onCancel,
    onCreateNew
}) => {
    return (
        <div className="flex items-center gap-2">
            {/* Add New Venue button */}
            <button
                onClick={onCreateNew}
                className="flex items-center gap-2 bg-fourth text-fifth px-1.5 py-1.5 rounded-md border border-secondary hover:bg-fourth/80 transition-colors text-sm whitespace-nowrap font-medium text-primary"
            >
                <Plus className="w-5 h-5" />
            </button>

            {/* Edit/Save and Cancel buttons */}
            <div className="flex items-center gap-2">
                {isEditing && (
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-2 py-1.5 font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-gray-500 text-primary border-secondary hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={onToggleEdit}
                    disabled={isSubmitting}
                    className="px-2 py-1.5 font-medium rounded-md transition-colors text-sm flex items-center justify-center min-w-[80px] border bg-fourth text-primary border-secondary hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
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
        </div>
    );
};
