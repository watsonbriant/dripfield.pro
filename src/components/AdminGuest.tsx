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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Guest Management</h3>
        
        <div className="flex items-center gap-2">
          {/* Add New Guest button */}
          <button
            onClick={handleOpenNewGuestModal}
            className="flex items-center gap-2 bg-[#f9ae37] text-black px-1.5 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Guest Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#f9ae37] text-black px-4 py-1.5 rounded-md border border-black hover:bg-[#e29d26] transition-colors text-sm whitespace-nowrap font-semibold"
            >
              Guest
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
                      placeholder="Search guests..."
                      className="w-full px-3 py-1.5 pr-8 rounded-md border border-black bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-[#a9682e] text-black placeholder-black/60"
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
                  {filteredGuests.map((guest) => (
                    <button
                      key={guest.guest_id}
                      onClick={() => handleGuestSelect(guest)}
                      className="w-full text-left px-4 py-1 text-sm text-black hover:bg-canvas transition-colors"
                    >
                      {guest.guest}
                    </button>
                  ))}
                  {filteredGuests.length === 0 && (
                    <div className="px-4 py-2 text-sm text-black/60 italic">
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
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg text-black font-semibold">{selectedGuest.guest}</h4>
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
              <label className="block text-sm font-semibold text-black">Guest Name</label>
              <input
                type="text"
                name="guest"
                value={editedGuest?.guest || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Display Name</label>
              <input
                type="text"
                name="guest_displayname"
                value={editedGuest?.guest_displayname || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Instrument</label>
              <input
                type="text"
                name="guest_instrument"
                value={editedGuest?.guest_instrument || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={`w-full px-3 py-2 rounded-md border ${isEditing ? 'border-black bg-canvas' : 'border-black bg-canvas/50'} text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm`}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Category</label>
              {isEditing ? (
                <select
                  name="guest_category"
                  value={editedGuest?.guest_category || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md border border-black bg-canvas text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
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
                  className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Canon ID</label>
              <input
                type="text"
                value={editedGuest?.guest_canonid || ''}
                readOnly
                className="w-full px-3 py-2 rounded-md border border-black bg-canvas/50 text-black focus:outline-none focus:ring-2 focus:ring-[#a9682e] text-sm"
              />
              <p className="text-xs text-black/60 italic">Auto-generated value</p>
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