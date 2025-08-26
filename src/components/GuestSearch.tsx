import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';

interface GuestBasic {
  guest: string;
  guest_id: string;
  guest_instrument?: string;
}

interface GuestSearchProps {
  className?: string;
}

export function GuestSearch({ className = '' }: GuestSearchProps) {
  const navigate = useNavigate();
  const [allGuests, setAllGuests] = React.useState<GuestBasic[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [selectedGuest, setSelectedGuest] = React.useState<string>('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    async function fetchAllGuests() {
      try {
        const { data, error } = await supabase
          .from('guests')
          .select('guest, guest_id, guest_instrument')
          .order('guest', { ascending: true });
    
        if (error) throw error;
        setAllGuests(data.map(g => ({ 
          guest: g.guest, 
          guest_id: g.guest_id,
          guest_instrument: g.guest_instrument 
        })));
      } catch (error) {
        console.error('Error fetching guests:', error);
      }
    }

    fetchAllGuests();
  }, []);

  const filteredGuests = React.useMemo(() => {
    return allGuests.filter(guest =>
      guest.guest.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGuests, searchTerm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="md:hidden">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-md bg-tertiary text-fifth hover:bg-primary transition-colors border border-secondary"
        >
          <Search className="w-6 h-6" />
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Guest"
        >
          <div className="space-y-0">
            <div className="sticky -top-4 bg-primary pb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guests..."
                className="w-full px-4 py-2 rounded-md border border-secondary bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
            <div className="divide-y divide-black/10">
              {filteredGuests.map((guest) => (
                <button
                  key={guest.guest_id}
                  onClick={() => {
                    setSelectedGuest(guest.guest);
                    setIsModalOpen(false);
                    setSearchTerm('');
                    navigate(`/guest/${guest.guest_id}`);
                  }}
                  className="w-full text-left px-4 py-1 text-sm rounded-md hover:bg-black/10 transition-colors font-semibold text-fifth"
                >
                  {guest.guest}
                  {guest.guest_instrument && (
                    <span className="text-fifth/70 ml-2">({guest.guest_instrument})</span>
                  )}
                </button>
              ))}
              {filteredGuests.length === 0 && (
                <div className="px-4 py-2 text-sm text-fifth/60 italic">
                  No guests found
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
      <div className="hidden md:block">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-tertiary text-fifth px-4 py-1 rounded-lg border border-secondary hover:bg-primary transition-colors text-lg font-semibold"
        >
          {selectedGuest || 'Search'}
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 py-1 bg-primary border border-secondary rounded-lg shadow-lg z-50 overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-96 max-h-96'
        }`}>
          <div className="p-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guests..."
                className="w-full px-3 py-1.5 pr-8 rounded-md border border-secondary bg-canvas text-fifth text-sm focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fifth/60" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/10">
            {filteredGuests.map((guest) => (
              <button
                key={guest.guest_id}
                onClick={() => {
                  setSelectedGuest(guest.guest);
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                  navigate(`/guest/${guest.guest_id}`);
                }}
                className="w-full text-left px-4 py-1 text-sm text-fifth leading-[1rem] font-medium hover:bg-canvas transition-colors"
              >
                {guest.guest}
                {guest.guest_instrument && (
                  <span className="text-fifth/90 text-xs font-light ml-2">({guest.guest_instrument})</span>
                )}
              </button>
            ))}
            {filteredGuests.length === 0 && (
              <div className="px-4 py-2 text-sm text-fifth/60 italic">
                No guests found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}