import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SongModal from './SongModal';

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

export const AdminSong: React.FC = () => {
  const [allSongs, setAllSongs] = useState<SongData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [artists, setArtists] = useState<ArtistData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSong, setEditedSong] = useState<SongData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isNewSong, setIsNewSong] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only fetch data once on mount
  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllSongs();
      fetchCategories();
      fetchArtists();
      mountedRef.current = true;
    }
  }, []);

  async function fetchAllSongs() {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('song, song_id, song_category, song_originalartist, song_categoryorder, song_coachnotes')
        .order('song', { ascending: true });
  
      if (error) throw error;
      setAllSongs(data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  }

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

  const filteredSongs = React.useMemo(() => {
    return allSongs.filter(song =>
      song.song.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSongs, searchTerm]);

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

  const toggleEdit = () => {
    if (isEditing) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!editedSong) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a copy of editedSong with empty strings converted to null
      const songToUpdate = {
        ...editedSong,
        song_category: editedSong.song_category === '' ? null : editedSong.song_category,
        song_originalartist: editedSong.song_originalartist === '' ? null : editedSong.song_originalartist,
        song_coachnotes: editedSong.song_coachnotes === '' ? null : editedSong.song_coachnotes
      };
      
      // Use the RPC function you created in Supabase
      const { error } = await supabase.rpc('update_song', {
        song_id_param: songToUpdate.song_id,
        song_param: songToUpdate.song,
        song_category_param: songToUpdate.song_category,
        song_originalartist_param: songToUpdate.song_originalartist,
        song_categoryorder_param: songToUpdate.song_categoryorder,
        song_coachnotes_param: songToUpdate.song_coachnotes
      });
      
      if (error) {
        console.error('Error updating song:', error);
        throw error;
      }
      
      // Update local state with the values that include nulls instead of empty strings
      setSelectedSong(songToUpdate);
      setEditedSong(songToUpdate);
      setIsEditing(false);
      
      // Refresh the songs list
      fetchAllSongs();
      
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

  const handleOpenEditSongModal = () => {
    if (selectedSong) {
      setIsNewSong(false);
      setIsSongModalOpen(true);
    }
  };

  const handleSongModalSave = () => {
    fetchAllSongs();
    setIsSongModalOpen(false);
  };

  return (
    <div>
      {/* Header with buttons and dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Song Management</h3>
        
        <div className="flex items-center gap-2">
          {/* Add New Song button */}
          <button
            onClick={handleOpenNewSongModal}
            className="flex items-center gap-2 bg-[#f9ae37] text-black px-1.5 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Song Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
            >
              Song
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 py-1 bg-primary border border-black rounded-lg shadow-lg z-50 w-64 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search songs..."
                      className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                  {filteredSongs.map((song) => (
                    <button
                      key={song.song_id}
                      onClick={() => handleSongSelect(song)}
                      className="w-full text-left px-4 py-1 text-sm text-black hover:bg-canvas transition-colors"
                    >
                      {song.song}
                    </button>
                  ))}
                  {filteredSongs.length === 0 && (
                    <div className="px-4 py-2 text-sm text-black/60 italic">
                      No songs found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song details section */}
      {selectedSong && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg text-black font-semibold">{selectedSong.song}</h4>
            <button
              onClick={toggleEdit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-black"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Song Title</label>
              <input
                type="text"
                name="song"
                value={editedSong?.song || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Category</label>
              {isEditing ? (
                <select
                  name="song_category"
                  value={editedSong?.song_category || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editedSong?.song_category || ''}
                  readOnly
                  className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Original Artist</label>
              {isEditing ? (
                <select
                  name="song_originalartist"
                  value={editedSong?.song_originalartist || ''}
                  onChange={handleInputChange}
                  className="w-full px-2 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                >
                  <option value="">-- Select Artist --</option>
                  {artists.map((artist) => (
                    <option key={artist.artist} value={artist.artist}>
                      {artist.artist}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editedSong?.song_originalartist || ''}
                  readOnly
                  className="w-full px-2 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Category Order</label>
              <input
                type="number"
                name="song_categoryorder"
                value={editedSong?.song_categoryorder === null ? '' : editedSong?.song_categoryorder}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-black">Coach's Notes</label>
              <textarea
                name="song_coachnotes"
                value={editedSong?.song_coachnotes || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                rows={4}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
          </div>
        </div>
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