import React from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { GuestCategory } from '../../types/setlist';

interface GuestsSectionProps {
  allGuests: GuestCategory[];
  selectedGuestIds: string[];
  guestSearchTerm: string;
  setGuestSearchTerm: (term: string) => void;
  isGuestSectionExpanded: boolean;
  setIsGuestSectionExpanded: (expanded: boolean) => void;
  isEditing: boolean;
  isNewEntry: boolean;
  handleGuestSelection: (guestId: string) => void;
  handleSelectAllGooseMembers: () => void;
}

export const GuestsSection: React.FC<GuestsSectionProps> = ({
  allGuests,
  selectedGuestIds,
  guestSearchTerm,
  setGuestSearchTerm,
  isGuestSectionExpanded,
  setIsGuestSectionExpanded,
  isEditing,
  isNewEntry,
  handleGuestSelection,
  handleSelectAllGooseMembers
}) => {
  // Filtered guests based on search term
  const filteredGuestsByCategory = React.useMemo(() => {
    if (!guestSearchTerm) return allGuests;
    
    return allGuests.map(category => ({
      ...category,
      guests: category.guests.filter(guest => 
        guest.guest.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
        guest.guest_displayname?.toLowerCase().includes(guestSearchTerm.toLowerCase()) ||
        guest.guest_instrument?.toLowerCase().includes(guestSearchTerm.toLowerCase())
      )
    })).filter(category => category.guests.length > 0);
  }, [allGuests, guestSearchTerm]);

  return (
    <div className="space-y-2 md:col-span-6 mt-2">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-fifth">Guests</label>
            {/* Move button next to the heading, only show when editing or new entry */}
            {(isEditing || isNewEntry) && (
              <button
                onClick={handleSelectAllGooseMembers}
                className="px-2 py-1 rounded-md bg-tertiary text-fifth hover:bg-canvas transition-colors text-xs font-medium border border-fourth"
              >
                Select All Goose Members
              </button>
            )}
          </div>
          <button 
            className="text-fifth hover:text-[#a9682e] cursor-pointer"
            onClick={() => setIsGuestSectionExpanded(!isGuestSectionExpanded)}
          >
            {isGuestSectionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Guest Pills */}
        {selectedGuestIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {selectedGuestIds.map(guestId => {
              // Find the guest info
              const guestInfo = allGuests.flatMap(category => category.guests)
                .find(g => g.guest_id === guestId);
              
              if (!guestInfo) return null;
              
              return (
                <div 
                  key={guestId} 
                  className="bg-tertiary text-fifth text-xs px-2 py-1 rounded-lg flex items-center border border-fourth"
                >
                  <span>{guestInfo.guest_displayname || guestInfo.guest}</span>
                  {(isEditing || isNewEntry) && (
                    <button 
                      className="ml-1 text-fifth/70 hover:text-fifth"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening/closing the section
                        handleGuestSelection(guestId);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {isGuestSectionExpanded && (
        <div className={`border rounded-md p-3 ${isEditing || isNewEntry ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'}`}>
          {/* Add search input */}
          {(isEditing || isNewEntry) && (
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={guestSearchTerm}
                  onChange={(e) => setGuestSearchTerm(e.target.value)}
                  placeholder="Search guests..."
                  className="w-full px-3 py-1.5 pr-8 rounded-md border border-fourth bg-canvas text-sm focus:outline-none focus:ring-1 focus:ring-tertiary text-fifth placeholder-black/60"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
              </div>
            </div>
          )}
          
          {filteredGuestsByCategory.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {filteredGuestsByCategory.map(category => (
                <div key={category.category} className="mb-4">
                  <h4 className="text-sm font-medium text-fifth mb-2">{category.category}</h4>
                  <div className="space-y-1">
                    {category.guests.map(guest => (
                      <div key={guest.guest_id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`guest-${guest.guest_id}`}
                          checked={selectedGuestIds.includes(guest.guest_id)}
                          onChange={() => handleGuestSelection(guest.guest_id)}
                          disabled={!isEditing && !isNewEntry}
                          className="mr-2 h-4 w-4 rounded border-fourth/30 bg-white checked:bg-tertiary focus:ring-tertiary disabled:opacity-50"
                        />
                        <label 
                          htmlFor={`guest-${guest.guest_id}`} 
                          className="text-fifth text-xs cursor-pointer"
                        >
                          {guest.guest_displayname || guest.guest}
                          {guest.guest_instrument && ` (${guest.guest_instrument})`}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-fifth/60 text-sm">
              {guestSearchTerm ? 'No guests found matching your search' : 'No guests available'}
            </p>
          )}
          
          {selectedGuestIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-fourth/10">
              <p className="text-sm text-fifth">Selected guests: {selectedGuestIds.length}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
