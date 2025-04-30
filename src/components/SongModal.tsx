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
        console.log('New song created successfully');
      } else {
        // Update existing song
        console.log('Updating song with data:', songToSave);
        
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
        console.log('Song updated successfully');
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#172330] border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl text-white font-semibold">
            {isNewSong ? 'Add New Song' : 'Edit Song'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-tertiary text-white hover:bg-tertiary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white">Song Title</label>
            <input
              type="text"
              name="song"
              value={editedSong?.song || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              placeholder="Enter song title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white">Category</label>
            <select
              name="song_category"
              value={editedSong?.song_category || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
            <label className="block text-sm font-semibold text-white">Original Artist</label>
            <select
              name="song_originalartist"
              value={editedSong?.song_originalartist || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
            <label className="block text-sm font-semibold text-white">Category Order</label>
            <input
              type="number"
              name="song_categoryorder"
              value={editedSong?.song_categoryorder === null ? '' : editedSong?.song_categoryorder}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              placeholder="Enter order number"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-white">Coach's Notes</label>
            <textarea
              name="song_coachnotes"
              value={editedSong?.song_coachnotes || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              placeholder="Add notes here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongModal;