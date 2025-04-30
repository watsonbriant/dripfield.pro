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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl text-white/90 font-semibold">Artist Management</h3>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#fce7ca] text-primary px-4 py-1.5 rounded-lg border border-border-primary hover:bg-surface-secondary transition-colors text-sm whitespace-nowrap font-semibold"
          >
            Current Artists
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 py-1 bg-[#fce7ca] border border-border-primary rounded-lg shadow-lg z-50 w-64 max-h-96 overflow-y-auto">
              <div className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search artists..."
                    className="w-full px-3 py-1.5 pr-8 rounded-md border border-border-primary bg-white/90 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border-primary/20">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.artist_id}
                    onClick={() => {
                      setSelectedArtist(artist.artist);
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                      // No action when selecting an artist as per requirements
                    }}
                    className="w-full text-left px-4 py-1 text-sm hover:bg-surface-secondary transition-colors"
                  >
                    {artist.artist}
                  </button>
                ))}
                {filteredArtists.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">
                    No artists found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add new artist section */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={newArtistName}
          onChange={(e) => setNewArtistName(e.target.value)}
          placeholder="Enter artist name"
          className="flex-grow px-3 py-2 rounded-md border border-white/10 bg-white/5 text-[#fce7ca] placeholder-[#fce7ca]/50 focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || buttonState === 'success' || buttonState === 'error'}
          className={`px-4 py-2 font-semibold rounded-md transition-colors text-sm flex items-center justify-center text-white min-w-[80px] ${
            buttonState === 'success' 
              ? 'bg-green-600 text-white' 
              : buttonState === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-tertiary text-primary hover:bg-tertiary/90'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Adding...' : 
           buttonState === 'success' ? <CheckCircle className="w-5 h-5" /> : 
           buttonState === 'error' ? <XCircle className="w-5 h-5" /> : 
           'Submit'}
        </button>
      </div>
    </div>
  );
};

export default AdminArtist;