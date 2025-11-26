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

// Custom hooks
const useChangeTypes = () => {
  const [changeTypes, setChangeTypes] = useState<ChangeTypeOption[]>([]);
  
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
    fetchChangeTypes();
  }, []);
  
  return changeTypes;
};

const useSongs = () => {
  const [songs, setSongs] = useState<SongOption[]>([]);
  
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { count, error: countError } = await supabase
          .from('songs')
          .select('*', { count: 'exact', head: true })
          .eq('song_placeholder', false);
        
        if (countError) throw countError;
        
        const batchSize = 1000;
        const totalBatches = Math.ceil((count || 0) / batchSize);
        let allData: any[] = [];
        
        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize - 1, (count || 0) - 1);
          
          const { data, error } = await supabase
            .from('songs')
            .select('song, song_id')
            .eq('song_placeholder', false)
            .order('song', { ascending: true })
            .range(start, end);
          
          if (error) throw error;
          if (data) allData = [...allData, ...data];
        }
        
        setSongs(allData.length > 0 ? allData.map(s => ({ song: s.song, song_id: s.song_id })) : []);
      } catch (error) {
        console.error('❌ Error in fetchSongs:', error);
        setSongs([]);
      }
    };
    fetchSongs();
  }, []);
  
  return songs;
};

// Form field components
const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-fifth">{label}</label>
    {children}
  </div>
);

const ChangeOrderField: React.FC<{ value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; readOnly: boolean }> = 
  ({ value, onChange, readOnly }) => (
    <FormField label="Order">
      <input
        type="number"
        name="change_order"
        value={value || ''}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full px-2 py-2 font-light rounded-md border ${
          readOnly ? 'border-fourth bg-canvas/50' : 'border-fourth bg-canvas'
        } text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm`}
      />
    </FormField>
  );

const ChangeTypeField: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; changeTypes: ChangeTypeOption[]; readOnly: boolean }> = 
  ({ value, onChange, changeTypes, readOnly }) => (
    <FormField label="Type">
      {readOnly ? (
        <input type="text" value={value || ''} readOnly className="w-full px-2 py-2 font-light rounded-md border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm" />
      ) : (
        <select name="change_type" value={value || ''} onChange={onChange} className="w-full px-2 py-2 font-light rounded-md border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm" required>
          <option value="">Select a type...</option>
          {changeTypes.map((type) => <option key={type.change} value={type.change}>{type.change}</option>)}
        </select>
      )}
    </FormField>
  );

const ChangeTextField: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; songs: SongOption[]; selectedSongId: string; onSongSelect: (songId: string) => void; onInsertArrow: () => void; readOnly: boolean }> = 
  ({ value, onChange, songs, selectedSongId, onSongSelect, onInsertArrow, readOnly }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-fifth">Change</label>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <select value={selectedSongId} onChange={(e) => onSongSelect(e.target.value)} className="px-2 py-1 w-48 rounded-md border border-fourth font-light bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs">
              <option value="">Add song link...</option>
              {songs.map((song) => <option key={song.song_id} value={song.song_id}>{song.song}</option>)}
            </select>
            <button type="button" onClick={onInsertArrow} className="px-2 py-1 rounded-md bg-tertiary text-fifth hover:bg-tertiary/70 transition-colors text-sm font-semibold border border-fourth" title="Insert arrow">→</button>
          </div>
        )}
      </div>
      <textarea name="change" value={value || ''} onChange={onChange} readOnly={readOnly} rows={6} placeholder="Enter the change details..." className={`w-full px-2 py-2 rounded-md border ${readOnly ? 'border-fourth bg-canvas/50' : 'border-fourth bg-canvas'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm font-mono`} />
      {readOnly && value && (
        <div className="mt-2 p-3 bg-canvas rounded-md border border-fourth/20">
          <p className="text-xs text-fifth/60 mb-2">Rendered HTML:</p>
          <div className="text-sm font-light text-fifth [&_a]:font-medium" dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}
    </div>
  );

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
  const [selectedSongId, setSelectedSongId] = useState<string>('');
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const changeTypes = useChangeTypes();
  const songs = useSongs();

  useEffect(() => {
    if (change) {
      setEditedChange(change);
      setIsEditing(isNewChange);
    }
  }, [change, isNewChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedChange) return;
    const { name, value } = e.target;
    const updatedValue = name === 'change_order' ? (value === '' ? 0 : parseInt(value) || 0) : value;
    setEditedChange({ ...editedChange, [name]: updatedValue });
  };

  const handleSongSelect = (songId: string) => {
    if (!editedChange || !songId) return;
    const selectedSong = songs.find(s => s.song_id === songId);
    if (!selectedSong) return;
    const songLink = `<a href="https://dripfield.pro/song/${selectedSong.song_id}">${selectedSong.song}</a>`;
    setEditedChange({ ...editedChange, change: editedChange.change + songLink });
    setSelectedSongId('');
  };

  const handleInsertArrow = () => {
    if (!editedChange) return;
    setEditedChange({ ...editedChange, change: editedChange.change + '→' });
  };

  const toggleEdit = () => {
    if (isEditing && !isNewChange) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedChange || !editedChange.change_type || !editedChange.change) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = isNewChange 
        ? await supabase.from('show_changes').insert({
            show_id: editedChange.show_id,
            change_order: editedChange.change_order,
            change_type: editedChange.change_type,
            change: editedChange.change
          })
        : await supabase.from('show_changes').update({
            change_order: editedChange.change_order,
            change_type: editedChange.change_type,
            change: editedChange.change
          }).eq('show_change_uuid', editedChange.show_change_uuid);
      
      if (error) throw error;
      setIsEditing(false);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving show change:', error);
      alert(`Error ${isNewChange ? 'creating' : 'updating'} change: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editedChange?.show_change_uuid) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('show_changes')
        .delete()
        .eq('show_change_uuid', editedChange.show_change_uuid);
      
      if (error) throw error;
      onSave();
      onClose();
    } catch (error) {
      console.error('Error deleting show change:', error);
      alert(`Error deleting change: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirming(false);
    }
  };

  if (!isOpen || !change) return null;

  const isReadOnly = !isEditing && !isNewChange;
  const handleDeleteClick = () => {
    if (isDeleteConfirming) {
      handleDelete();
    } else {
      setIsDeleteConfirming(true);
      setTimeout(() => setIsDeleteConfirming(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-primary border border-fourth rounded-lg p-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">
            {isNewChange ? 'Add Show Change' : 'Edit Show Change'}
          </h3>
          <div className="flex gap-2">
            {!isNewChange && (
              <>
                <button onClick={toggleEdit} disabled={isSubmitting} className="flex items-center justify-center gap-2 w-10 h-10 rounded-md bg-tertiary text-fifth hover:bg-tertiary/70 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-fourth">
                  {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </button>
                <button onClick={handleDeleteClick} disabled={isSubmitting} className={`flex items-center justify-center w-10 h-10 rounded-md border ${isDeleteConfirming ? 'bg-green-500 hover:bg-green-600 border-fourth' : 'bg-red-500 hover:bg-red-600 border-fourth'} text-fifth transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} title={isDeleteConfirming ? "Confirm Delete" : "Delete"}>
                  {isDeleteConfirming ? <Check className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}
            {isNewChange && (
              <button onClick={handleSaveChanges} disabled={isSubmitting || !editedChange?.change_type || !editedChange?.change} className="flex items-center gap-2 px-3 py-2 rounded-md bg-tertiary text-fifth hover:bg-tertiary/70 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-fourth">
                <Save className="w-5 h-5" />
                {isSubmitting && <span className="ml-1">...</span>}
              </button>
            )}
            <button onClick={onClose} className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500 hover:bg-red-600 transition-colors border border-fourth">
              <X className="w-5 h-5 text-fifth" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <ChangeOrderField value={editedChange?.change_order || 0} onChange={handleInputChange} readOnly={isReadOnly} />
          <ChangeTypeField value={editedChange?.change_type || ''} onChange={handleInputChange} changeTypes={changeTypes} readOnly={isReadOnly} />
          <ChangeTextField value={editedChange?.change || ''} onChange={handleInputChange} songs={songs} selectedSongId={selectedSongId} onSongSelect={handleSongSelect} onInsertArrow={handleInsertArrow} readOnly={isReadOnly} />
        </div>
      </div>
    </div>
  );
};

export default ShowChangeModal;