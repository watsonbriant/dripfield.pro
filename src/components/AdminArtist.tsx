import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ArtistBasic {
  artist: string;
  artist_id: string;
}

export const AdminArtist: React.FC = () => {
  const [allArtists, setAllArtists] = useState<ArtistBasic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  
  // State variables
  const [newArtistName, setNewArtistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonState, setButtonState] = useState<'default' | 'success' | 'error'>('default');

  // Timer to reset button state after 2 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (buttonState !== 'default') {
      timer = setTimeout(() => {
        setButtonState('default');
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [buttonState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch artists only once when component mounts
  useEffect(() => {
    if (!mountedRef.current) {
      fetchAllArtists();
      mountedRef.current = true;
    }
  }, []);

  async function fetchAllArtists() {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('artist, artist_id')
        .order('artist', { ascending: true });
  
      if (error) throw error;
      setAllArtists(data || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    }
  }

  const filteredArtists = React.useMemo(() => {
    return allArtists.filter(artist =>
      artist.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allArtists, searchTerm]);

  const handleSubmit = async () => {
    // Reset button state
    setButtonState('default');
    
    // Validate input
    if (!newArtistName.trim()) {
      setButtonState('error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if artist already exists
      const artistExists = allArtists.some(
        artist => artist.artist.toLowerCase() === newArtistName.trim().toLowerCase()
      );

      if (artistExists) {
        setButtonState('error');
        setIsSubmitting(false);
        return;
      }

      // Insert new artist using RPC (stored procedure)
      const { error } = await supabase.rpc('add_artist', {
        artist_name: newArtistName.trim()
      });

      if (error) {
        console.error('Error from RPC:', error);
        throw new Error(`Failed to add artist: ${error.message}`);
      }

      // Success
      setButtonState('success');
      setNewArtistName(''); // Clear input
      
      // Refresh the artist list
      fetchAllArtists();
    } catch (error) {
      console.error('Error adding artist:', error);
      setButtonState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header with right-aligned dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">Artist Management</h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
          >
            Current Artists
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 bg-primary border border-fourth shadow-xl z-50 w-64 max-h-96 overflow-y-auto">
              <div className="p-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search artists..."
                    className="w-full px-2 py-0.5 pr-8 border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.artist_id}
                    onClick={() => {
                      setSelectedArtist(artist.artist);
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                      // No action when selecting an artist as per requirements
                    }}
                    className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors"
                  >
                    {artist.artist}
                  </button>
                ))}
                {filteredArtists.length === 0 && (
                  <div className="px-2 py-0.5 text-xs text-fifth text-center">
                    No artists found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add new artist section */}
      <div className="px-1 pb-1 flex flex-col md:flex-row gap-1">
        <input
          type="text"
          value={newArtistName}
          onChange={(e) => setNewArtistName(e.target.value)}
          placeholder="Enter artist name"
          className="flex-grow px-2 py-0.5 border border-fourth bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || buttonState === 'success' || buttonState === 'error'}
          className={`px-2 py-0.5 font-medium transition-colors text-xs flex items-center justify-center min-w-[80px] border ${
            buttonState === 'success' 
              ? 'bg-green-500 text-white border-green-700' 
              : buttonState === 'error'
              ? 'bg-red-500 text-white border-red-700'
              : 'bg-fourth text-white border-fourth hover:bg-fourth/80'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Adding...' : 
           buttonState === 'success' ? <CheckCircle className="w-4 h-4" /> : 
           buttonState === 'error' ? <XCircle className="w-4 h-4" /> : 
           'Submit'}
        </button>
      </div>
    </div>
  );
};

export default AdminArtist;