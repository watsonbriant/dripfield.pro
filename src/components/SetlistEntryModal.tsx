import React, { useState } from 'react';
import { Save, Edit, X, Trash2, Check } from 'lucide-react';
import { SetlistEntryData } from '../types/setlist';
import { useSetlistOptions } from '../hooks/useSetlistOptions';
import { useSetlistEntryForm } from '../hooks/useSetlistEntryForm';
import { useSetlistEntryActions } from '../hooks/useSetlistEntryActions';
import { BasicInfoSection } from './setlist/BasicInfoSection';
import { SongSection } from './setlist/SongSection';
import { SongDetailsSection } from './setlist/SongDetailsSection';
import { GuestsSection } from './setlist/GuestsSection';

interface SetlistEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SetlistEntryData | null;
  onSave: () => void;
  onSaveStatusUpdate: (status: 'idle' | 'processing' | 'done' | 'error') => void;
  isNewEntry?: boolean;
}

const SetlistEntryModal: React.FC<SetlistEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  entry, 
  onSave,
  onSaveStatusUpdate,
  isNewEntry = false
}) => {
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isGuestSectionExpanded, setIsGuestSectionExpanded] = useState(false);
  const [guestSearchTerm, setGuestSearchTerm] = useState('');

  // Custom hooks
  const { sets, setnums, segues, placements, songs, shorts, allGuests } = useSetlistOptions();
  const {
    isEditing,
    setIsEditing,
    editedEntry,
    selectedGuestIds,
    songSearchTerm,
    setSongSearchTerm,
    isSongDropdownOpen,
    setIsSongDropdownOpen,
    selectedSongName,
    selectedNewSongOption,
    setSelectedNewSongOption,
    handleInputChange,
    handleSongSelection,
    handleGuestSelection,
    handleSelectAllGooseMembers
  } = useSetlistEntryForm(entry, isNewEntry);
  
  const { isSubmitting, saveStatus, saveEntry, deleteEntry } = useSetlistEntryActions();

  const toggleEdit = () => {
    if (isEditing && !isNewEntry) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedEntry) return;
    
    // Close modal immediately
    onClose();
    
    await saveEntry(
      editedEntry,
      selectedGuestIds,
      selectedNewSongOption,
      isNewEntry,
      onSave,
      onSaveStatusUpdate
    );
    
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!entry?.entry_id) return;
    
    if (isDeleteConfirming) {
      await deleteEntry(entry.entry_id, onSave, onClose, onSaveStatusUpdate);
      setIsDeleteConfirming(false);
    } else {
      // First click - ask for confirmation
      setIsDeleteConfirming(true);
      
      // Auto-reset confirmation state after 3 seconds
      setTimeout(() => {
        setIsDeleteConfirming(false);
      }, 3000);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-primary border border-fourth w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className={`px-2 py-0.5 border border-fourth transition-colors ${
              saveStatus === 'processing' ? 'bg-black text-white' :
              saveStatus === 'done' ? 'bg-green-600 text-white' :
              saveStatus === 'error' ? 'bg-red-600 text-white' :
              'bg-fourth text-white'
            }`}>
              <span className="text-xs font-medium">
                {saveStatus === 'processing' ? 'Processing...' :
                 saveStatus === 'done' ? 'Done!' :
                 saveStatus === 'error' ? 'Error.' :
                 'Saving...'}
              </span>
            </div>
          </div>
        )}
        
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">
              {isNewEntry ? 'Add Setlist Entry' : 'Edit Setlist Entry'}
            </h3>
            <div className="flex gap-2">
              {!isNewEntry && (
                <>
                  <button
                    onClick={toggleEdit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-1 px-2 py-0.5 bg-blue-500 text-white hover:bg-blue-500/70 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-fourth"
                  >
                    {isEditing ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Only show delete button for existing entries */}
                  {entry && entry.entry_id && (
                    <button
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className={`flex text-white items-center justify-center px-2 py-0.5 border ${
                        isDeleteConfirming 
                          ? 'bg-green-500 hover:bg-green-600 border-fourth' 
                          : 'bg-red-500 hover:bg-red-600 border-fourth'
                      } text-fifth transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium`}
                      title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
                    >
                      {isDeleteConfirming ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </>
              )}
              {isNewEntry && (
                <button
                  onClick={handleSaveChanges}
                  disabled={isSubmitting || !editedEntry?.entry_set || !editedEntry?.entry_song}
                  className="flex items-center gap-1 px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-fourth"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting && <span className="ml-1">...</span>}
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center justify-center px-2 py-0.5 bg-fifth hover:bg-red-600 text-red-600 hover:text-fifth transition-colors border border-fourth text-xs font-medium"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-2 py-1">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <BasicInfoSection
            sets={sets}
            setnums={setnums}
            placements={placements}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleInputChange={handleInputChange}
          />
          
          <SongSection
            songs={songs}
            songSearchTerm={songSearchTerm}
            setSongSearchTerm={setSongSearchTerm}
            isSongDropdownOpen={isSongDropdownOpen}
            setIsSongDropdownOpen={setIsSongDropdownOpen}
            selectedSongName={selectedSongName}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleSongSelection={handleSongSelection}
          />
          
          <SongDetailsSection
            segues={segues}
            shorts={shorts}
            editedEntry={editedEntry}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleInputChange={handleInputChange}
          />
          
          <GuestsSection
            allGuests={allGuests}
            selectedGuestIds={selectedGuestIds}
            guestSearchTerm={guestSearchTerm}
            setGuestSearchTerm={setGuestSearchTerm}
            isGuestSectionExpanded={isGuestSectionExpanded}
            setIsGuestSectionExpanded={setIsGuestSectionExpanded}
            isEditing={isEditing}
            isNewEntry={isNewEntry}
            handleGuestSelection={handleGuestSelection}
            handleSelectAllGooseMembers={() => handleSelectAllGooseMembers(allGuests)}
          />
          
          {/* Coach's Notes */}
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-fifth mb-0.5">Coach's Notes</label>
            <textarea
              name="entry_coachnotes"
              value={editedEntry?.entry_coachnotes || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewEntry}
              rows={4}
              className={`w-full font-light px-2 py-0.5 border ${isEditing || isNewEntry ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
            />
          </div>

          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-fifth mb-0.5">New Song?</label>
            <select
              name="new_song_option"
              value={selectedNewSongOption}
              onChange={(e) => setSelectedNewSongOption(e.target.value)}
              disabled={!isEditing && !isNewEntry}
              className={`w-full font-light px-2 py-0.5 border ${
                isEditing || isNewEntry ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'
              } text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
            >
              <option value="N/A">N/A</option>
              <option value="New Original Song">New Original Song</option>
              <option value="New Cover Song">New Cover Song</option>
            </select>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SetlistEntryModal;