import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Save, Edit, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuestModal from './GuestModal';

interface GuestData {
  guest: string;
  guest_id: string;
  guest_displayname: string | null;
  guest_instrument: string | null;
  guest_category: string | null;
  guest_canonid: number | null;
}

export const AdminGuest: React.FC = () => {
  const [allGuests, setAllGuests] = useState<GuestData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<GuestData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGuest, setEditedGuest] = useState<GuestData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  
  const guestCategories = [
    "Goose (current)",
    "Goose (former)",
    "Group",
    "Guest"
  ];

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
      fetchAllGuests();
      mountedRef.current = true;
    }
  }, []);

  async function fetchAllGuests() {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('guest, guest_id, guest_displayname, guest_instrument, guest_category, guest_canonid')
        .order('guest', { ascending: true });
  
      if (error) throw error;
      setAllGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  }

  const filteredGuests = React.useMemo(() => {
    return allGuests.filter(guest =>
      guest.guest.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGuests, searchTerm]);

  const handleGuestSelect = (guest: GuestData) => {
    setSelectedGuest(guest);
    setEditedGuest(guest);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedGuest) return;
    
    const { name, value } = e.target;
    setEditedGuest({
      ...editedGuest,
      [name]: value === '' ? null : value,
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
    if (!editedGuest) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a copy of editedGuest with empty strings converted to null
      const guestToUpdate = {
        ...editedGuest,
        guest_displayname: editedGuest.guest_displayname === '' ? null : editedGuest.guest_displayname,
        guest_instrument: editedGuest.guest_instrument === '' ? null : editedGuest.guest_instrument,
        guest_category: editedGuest.guest_category === '' ? null : editedGuest.guest_category,
      };
      
      // Perform the update
      const { error } = await supabase
        .from('guests')
        .update({
          guest: guestToUpdate.guest,
          guest_displayname: guestToUpdate.guest_displayname,
          guest_instrument: guestToUpdate.guest_instrument,
          guest_category: guestToUpdate.guest_category
        })
        .eq('guest_id', guestToUpdate.guest_id);
      
      if (error) {
        console.error('Error updating guest:', error);
        throw error;
      }
      
      // Update local state with the values that include nulls instead of empty strings
      setSelectedGuest(guestToUpdate);
      setEditedGuest(guestToUpdate);
      setIsEditing(false);
      
      // Refresh the guests list
      fetchAllGuests();
      
    } catch (error) {
      console.error('Error updating guest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNewGuestModal = () => {
    setIsNewGuest(true);
    setIsGuestModalOpen(true);
  };

  const handleOpenEditGuestModal = () => {
    if (selectedGuest) {
      setIsNewGuest(false);
      setIsGuestModalOpen(true);
    }
  };

  const handleGuestModalSave = () => {
    fetchAllGuests();
    setIsGuestModalOpen(false);
  };

  return (
    <div>
      {/* Header with buttons and dropdown */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold bg-fourth text-white inline-block px-2 py-0.5">
          Guest Management
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Add New Guest button */}
          <button
            onClick={handleOpenNewGuestModal}
            className="flex items-center gap-2 bg-fourth text-white px-1 py-[3px] border border-fourth hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Guest Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-fourth text-white px-2 py-1 hover:bg-fourth/80 transition-colors text-xs whitespace-nowrap font-medium"
            >
              Guest
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
                      placeholder="Search guests..."
                      className="w-full px-2 py-0.5 pr-8 border border-fourth bg-canvas font-light text-xs focus:outline-none focus:ring-1 focus:ring-fourth text-fifth placeholder-black/60"
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                  {filteredGuests.map((guest) => (
                    <button
                      key={guest.guest_id}
                      onClick={() => handleGuestSelect(guest)}
                      className="w-full text-left px-2 py-1 font-light text-xs text-fifth hover:bg-tertiary/40 transition-colors"
                    >
                      {guest.guest}
                    </button>
                  ))}
                  {filteredGuests.length === 0 && (
                    <div className="px-2 py-0.5 text-xs text-fifth text-center">
                      No guests found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guest details section */}
      {selectedGuest && (
        <div className='px-2 pb-1'>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm text-fifth font-medium">{selectedGuest.guest}</h4>
            <button
              onClick={toggleEdit}
              disabled={isSubmitting}
              className="px-2 py-0.5 font-medium transition-colors text-xs flex items-center justify-center border bg-fourth text-white border-fourth hover:bg-fourth/80 disabled:opacity-50 disabled:cursor-not-allowed gap-1"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">Guest Name</label>
              <input
                type="text"
                name="guest"
                value={editedGuest?.guest || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">Display Name</label>
              <input
                type="text"
                name="guest_displayname"
                value={editedGuest?.guest_displayname || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">Instrument</label>
              <input
                type="text"
                name="guest_instrument"
                value={editedGuest?.guest_instrument || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">Category</label>
              {isEditing ? (
                <select
                  name="guest_category"
                  value={editedGuest?.guest_category || ''}
                  onChange={handleInputChange}
                  className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                >
                  <option value="">-- Select Category --</option>
                  {guestCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editedGuest?.guest_category || ''}
                  readOnly
                  className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                />
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">Canon ID</label>
              <input
                type="text"
                value={editedGuest?.guest_canonid || ''}
                readOnly
                className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
              />
              <p className="text-xs text-fifth/60 italic mt-0.5">Auto-generated value</p>
            </div>
          </div>
        </div>
      )}

      {/* Guest Modal for creating or editing guests */}
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        guest={selectedGuest}
        onSave={handleGuestModalSave}
        isNewGuest={isNewGuest}
      />
    </div>
  );
};

export default AdminGuest;