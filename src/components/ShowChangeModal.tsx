import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Edit, X, Trash2, Check } from 'lucide-react';

interface ShowChangeData {
  show_change_uuid: string;
  show_id: string;
  change_order: number;
  change_type: string;
  change: string;
}

interface SongOption {
  song: string;
  song_id: string;
}

interface ChangeTypeOption {
  change: string;
}

interface ShowChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  change: ShowChangeData | null;
  onSave: () => void;
  isNewChange?: boolean;
}

const ShowChangeModal: React.FC<ShowChangeModalProps> = ({ 
  isOpen, 
  onClose, 
  change, 
  onSave,
  isNewChange = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedChange, setEditedChange] = useState<ShowChangeData | null>(null);
  const [changeTypes, setChangeTypes] = useState<ChangeTypeOption[]>([]);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  // Load change types and songs on component mount
  useEffect(() => {
    const fetchChangeTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('changes')
          .select('change')
          .order('change');
        
        if (error) throw error;
        setChangeTypes(data || []);
      } catch (error) {
        console.error('Error fetching change types:', error);
      }
    };

    const fetchSongs = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('song, song_id')
          .order('song');
        
        if (error) throw error;
        setSongs(data || []);
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };

    fetchChangeTypes();
    fetchSongs();
  }, []);

  // Update local state when change prop changes
  useEffect(() => {
    if (change) {
      setEditedChange(change);
      setIsEditing(isNewChange);
    }
  }, [change, isNewChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedChange) return;
    
    const { name, value } = e.target;
    
    let updatedValue: string | number = value;
    
    if (name === 'change_order') {
      updatedValue = value === '' ? 0 : parseInt(value) || 0;
    }
    
    setEditedChange({
      ...editedChange,
      [name]: updatedValue,
    });
  };

  // Handle song selection and insert link
  const handleSongSelect = (songId: string) => {
    if (!editedChange || !songId) return;
    
    const selectedSong = songs.find(s => s.song_id === songId);
    if (!selectedSong) return;
    
    const songLink = `<a href="https://dripfield.pro/song/${selectedSong.song_id}">${selectedSong.song}</a>`;
    
    setEditedChange({
      ...editedChange,
      change: editedChange.change + songLink
    });
    
    // Reset the dropdown
    setSelectedSongId('');
  };

  // Handle arrow insertion
  const handleInsertArrow = () => {
    if (!editedChange) return;
    
    setEditedChange({
      ...editedChange,
      change: editedChange.change + '→'
    });
  };

  const toggleEdit = () => {
    if (isEditing && !isNewChange) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedChange) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!editedChange.change_type || !editedChange.change) {
        alert('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      if (isNewChange) {
        // Insert new change
        const insertData = {
          show_id: editedChange.show_id,
          change_order: editedChange.change_order,
          change_type: editedChange.change_type,
          change: editedChange.change
        };
        
        const { error } = await supabase
          .from('show_changes')
          .insert(insertData);
        
        if (error) {
          console.error('Error creating show change:', error);
          alert(`Error creating change: ${error.message}`);
          throw error;
        }
      } else {
        // Update existing change
        const { error } = await supabase
          .from('show_changes')
          .update({
            change_order: editedChange.change_order,
            change_type: editedChange.change_type,
            change: editedChange.change
          })
          .eq('show_change_uuid', editedChange.show_change_uuid);
        
        if (error) {
          console.error('Error updating show change:', error);
          alert(`Error updating change: ${error.message}`);
          throw error;
        }
      }
      
      setIsEditing(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving show change:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editedChange || !editedChange.show_change_uuid) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('show_changes')
        .delete()
        .eq('show_change_uuid', editedChange.show_change_uuid);
      
      if (error) {
        console.error('Error deleting show change:', error);
        alert(`Error deleting change: ${error.message}`);
      } else {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirming(false);
    }
  };

  if (!isOpen || !change) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-primary border border-black rounded-lg p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">
            {isNewChange ? 'Add Show Change' : 'Edit Show Change'}
          </h3>
          <div className="flex gap-2">
            {!isNewChange && (
              <>
                <button
                  onClick={toggleEdit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 w-10 h-10 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-black"
                >
                  {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => {
                    if (isDeleteConfirming) {
                      handleDelete();
                    } else {
                      setIsDeleteConfirming(true);
                      setTimeout(() => {
                        setIsDeleteConfirming(false);
                      }, 3000);
                    }
                  }}
                  disabled={isSubmitting}
                  className={`flex items-center justify-center w-10 h-10 rounded-md border ${
                    isDeleteConfirming 
                      ? 'bg-green-500 hover:bg-green-600 border-black' 
                      : 'bg-red-500 hover:bg-red-600 border-black'
                  } text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isDeleteConfirming ? "Confirm Delete" : "Delete"}
                >
                  {isDeleteConfirming ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
            {isNewChange && (
              <button
                onClick={handleSaveChanges}
                disabled={isSubmitting || !editedChange?.change_type || !editedChange?.change}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-black"
              >
                <Save className="w-5 h-5" />
                {isSubmitting && <span className="ml-1">...</span>}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-md bg-canvas hover:bg-black/10 transition-colors border border-black"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Change Order */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">Order</label>
            <input
              type="number"
              name="change_order"
              value={editedChange?.change_order || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewChange}
              className={`w-full px-2 py-2 rounded-md border ${
                isEditing || isNewChange ? 'border-black bg-canvas' : 'border-black bg-canvas/50'
              } text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
            />
          </div>

          {/* Change Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black">Type</label>
            {isEditing || isNewChange ? (
              <select
                name="change_type"
                value={editedChange?.change_type || ''}
                onChange={handleInputChange}
                className="w-full px-2 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                required
              >
                <option value="">Select a type...</option>
                {changeTypes.map((type) => (
                  <option key={type.change} value={type.change}>
                    {type.change}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editedChange?.change_type || ''}
                readOnly
                className="w-full px-2 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
              />
            )}
          </div>

          {/* Change */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-black">Change</label>
              {(isEditing || isNewChange) && (
                <div className="flex items-center gap-2">
                  {/* Songs Dropdown */}
                  <select
                    value={selectedSongId}
                    onChange={(e) => handleSongSelect(e.target.value)}
                    className="px-2 py-1 w-48 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-xs"
                  >
                    <option value="">Add song link...</option>
                    {songs.map((song) => (
                      <option key={song.song_id} value={song.song_id}>
                        {song.song}
                      </option>
                    ))}
                  </select>
                  
                  {/* Arrow Button */}
                  <button
                    type="button"
                    onClick={handleInsertArrow}
                    className="px-2 py-1 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm font-semibold border border-black"
                    title="Insert arrow"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            <textarea
              name="change"
              value={editedChange?.change || ''}
              onChange={handleInputChange}
              readOnly={!isEditing && !isNewChange}
              rows={6}
              placeholder="Enter the change details..."
              className={`w-full px-2 py-2 rounded-md border ${
                isEditing || isNewChange ? 'border-black bg-canvas' : 'border-black bg-canvas/50'
              } text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm font-mono`}
            />
            {!isEditing && !isNewChange && editedChange?.change && (
              <div className="mt-2 p-3 bg-canvas rounded-md border border-black/20">
                <p className="text-xs text-black/60 mb-2">Rendered HTML:</p>
                <div 
                  className="text-sm text-black [&_a]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: editedChange.change }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowChangeModal;