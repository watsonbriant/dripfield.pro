import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, X } from 'lucide-react';

interface SongData {
  song: string;
  song_id: string;
  song_category: string | null;
  song_originalartist: string | null;
  song_categoryorder: number | null;
  song_coachnotes: string | null;
}

interface CategoryData {
  category: string;
}

interface ArtistData {
  artist: string;
}

interface SongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song?: SongData | null;
  onSave: () => void;
  isNewSong?: boolean;
}

const SongModal: React.FC<SongModalProps> = ({ 
  isOpen, 
  onClose, 
  song, 
  onSave, 
  isNewSong = false 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedSong, setEditedSong] = useState<SongData | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [artists, setArtists] = useState<ArtistData[]>([]);

  // Load dropdown options on component mount
  useEffect(() => {
    fetchCategories();
    fetchArtists();
  }, []);

  // Update local state when song changes
  useEffect(() => {
    if (isNewSong) {
      // Initialize with empty values for a new song
      setEditedSong({
        song: '',
        song_id: '',
        song_category: '',  // Empty string instead of null
        song_originalartist: '',
        song_categoryorder: null, // Number types can remain null
        song_coachnotes: ''
      });
    } else if (song) {
      setEditedSong(song);
    }
  }, [song, isNewSong]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('category')
        .order('category', { ascending: true });
  
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchArtists() {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('artist')
        .order('artist', { ascending: true });
  
      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  }

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

  const handleSaveChanges = async () => {
    if (!editedSong) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a copy of editedSong with empty strings converted to null
      const songToSave = {
        ...editedSong,
        song_category: editedSong.song_category === '' ? null : editedSong.song_category,
        song_originalartist: editedSong.song_originalartist === '' ? null : editedSong.song_originalartist,
        song_coachnotes: editedSong.song_coachnotes === '' ? null : editedSong.song_coachnotes
      };
      
      if (isNewSong) {
        // Insert new song
        const { error } = await supabase
          .from('songs')
          .insert({
            song: songToSave.song,
            song_category: songToSave.song_category,
            song_originalartist: songToSave.song_originalartist,
            song_categoryorder: songToSave.song_categoryorder,
            song_coachnotes: songToSave.song_coachnotes
          });
        
        if (error) throw error;
      } else {
        // Update existing song
        
        // Use the RPC function for updates
        const { error } = await supabase.rpc('update_song', {
          song_id_param: songToSave.song_id,
          song_param: songToSave.song,
          song_category_param: songToSave.song_category,
          song_originalartist_param: songToSave.song_originalartist,
          song_categoryorder_param: songToSave.song_categoryorder,
          song_coachnotes_param: songToSave.song_coachnotes
        });
        
        if (error) throw error;
      }
      
      onSave(); // Trigger refetch of songs
      onClose(); // Close the modal
      
    } catch (error) {
      console.error('Error saving song:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] bottom-4 md:top-20 md:bottom-auto md:max-w-2xl md:w-full z-50 bg-primary rounded-lg border border-fourth shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">
            {isNewSong ? 'Add New Song' : 'Edit Song'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-tertiary text-fifth hover:bg-tertiary/80 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-fourth"
            >
              <Save className="w-4 h-4 text-fifth" />
              <span className="text-fifth">Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-tertiary rounded-lg border border-fourth bg-red-500 transition-colors"
            >
              <X className="w-5 h-5 text-fifth" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">Song Title</label>
              <input
                type="text"
                name="song"
                value={editedSong?.song || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas font-light text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Enter song title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">Category</label>
              <select
                name="song_category"
                value={editedSong?.song_category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas font-light text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">Original Artist</label>
              <select
                name="song_originalartist"
                value={editedSong?.song_originalartist || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas font-light text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              >
                <option value="">-- Select Artist --</option>
                {artists.map((artist) => (
                  <option key={artist.artist} value={artist.artist}>
                    {artist.artist}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">Category Order</label>
              <input
                type="number"
                name="song_categoryorder"
                value={editedSong?.song_categoryorder === null ? '' : editedSong?.song_categoryorder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas font-light text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Enter order number"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-fifth">Coach's Notes</label>
              <textarea
                name="song_coachnotes"
                value={editedSong?.song_coachnotes || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-fourth bg-canvas font-light text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                placeholder="Add notes here..."
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SongModal;