import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSongsData } from '../hooks/useSongsData';
import { transformSongForUpdate, updateSong } from '../utils/songUtils';
import { SongDropdown } from './SongDropdown';
import { SongDetailsForm } from './SongDetailsForm';
import SongModal from './SongModal';

interface SongData {
  song: string;
  song_id: string;
  song_category: string | null;
  song_originalartist: string | null;
  song_categoryorder: number | null;
  song_coachnotes: string | null;
}

export const AdminSong: React.FC = () => {
  const { allSongs, categories, artists, refetchSongs } = useSongsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSong, setEditedSong] = useState<SongData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isNewSong, setIsNewSong] = useState(false);

  const handleSongSelect = (song: SongData) => {
    setSelectedSong(song);
    setEditedSong(song);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedSong) return;
    
    const { name, value } = e.target;
    setEditedSong({
      ...editedSong,
      [name]: name === 'song_categoryorder' 
        ? (value === '' ? null : parseInt(value) || 0) 
        : value,
    });
  };

  const toggleEdit = async () => {
    if (isEditing) {
      await handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedSong) return;
    
    setIsSubmitting(true);
    
    try {
      const songToUpdate = transformSongForUpdate(editedSong);
      const updatedSong = await updateSong(songToUpdate);
      
      setSelectedSong(updatedSong);
      setEditedSong(updatedSong);
      setIsEditing(false);
      refetchSongs();
    } catch (error) {
      console.error('Error updating song:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNewSongModal = () => {
    setIsNewSong(true);
    setIsSongModalOpen(true);
  };

  const handleSongModalSave = () => {
    refetchSongs();
    setIsSongModalOpen(false);
  };

  return (
    <div>
      {/* Header with buttons and dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
          Song Management
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Add New Song button */}
          <button
            onClick={handleOpenNewSongModal}
            className="flex items-center gap-2 bg-fourth text-white px-1 py-[3px] border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Song Dropdown */}
          <SongDropdown
            songs={allSongs}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            onSongSelect={handleSongSelect}
          />
        </div>
      </div>

      {/* Song details section */}
      {selectedSong && (
        <SongDetailsForm
          selectedSong={selectedSong}
          editedSong={editedSong}
          isEditing={isEditing}
          isSubmitting={isSubmitting}
          categories={categories}
          artists={artists}
          onToggleEdit={toggleEdit}
          onInputChange={handleInputChange}
        />
      )}

      {/* Song Modal for creating or editing songs */}
      <SongModal
        isOpen={isSongModalOpen}
        onClose={() => setIsSongModalOpen(false)}
        song={selectedSong}
        onSave={handleSongModalSave}
        isNewSong={isNewSong}
      />
    </div>
  );
};

export default AdminSong;