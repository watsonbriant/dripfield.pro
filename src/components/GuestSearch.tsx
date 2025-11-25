import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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
        <div className="relative">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full px-1.5 py-0.5 pr-8 rounded-md border border-fourth bg-canvas font-semibold text-fifth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary text-left flex items-center"
          >
            Search
          </button>
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-fifth pointer-events-none" />
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Select Guest"
        >
          <div className="space-y-0">
            <div className="sticky bg-primary py-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search personnel..."
                className="w-full px-1.5 py-0.5 text-sm rounded-md border border-fourth bg-canvas text-fifth placeholder-black/60 focus:outline-none focus:ring-2 focus:ring-tertiary"
              />
            </div>
            <div>
              {filteredGuests.map((guest) => (
                <button
                  key={guest.guest_id}
                  onClick={() => {
                    setIsModalOpen(false);
                    setSearchTerm('');
                    navigate(`/personnel/${guest.guest_id}`);
                  }}
                  className="w-full text-left px-2 py-1 text-xs leading-[0.75rem] hover:bg-black/10 transition-colors font-medium text-fifth"
                >
                  {guest.guest}
                  {guest.guest_instrument && (
                    <span className="text-fifth/70 font-light text-[0.625rem] leading-[0.75rem] ml-2">({guest.guest_instrument})</span>
                  )}
                </button>
              ))}
              {filteredGuests.length === 0 && (
                <div className="px-2 py-1 text-sm text-fifth italic">
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
          className="flex items-center gap-2 bg-canvas text-fifth px-1.5 py-0.5 rounded-lg border border-fourth hover:bg-primary transition-colors text-xs font-semibold"
        >
          Search
          <Search className="w-3 h-3" />
        </button>
      </div>
      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 bg-canvas border border-fourth shadow-lg z-50 overflow-y-auto ${
          window.innerWidth < 768 ? 'fixed left-0 right-0 mx-2 top-[72px]' : 'right-0 w-64 max-h-96'
        }`}>
          <div className="p-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search personnel..."
                className="w-full px-1.5 py-0.5 pr-8 rounded-md border border-fourth bg-primary text-fifth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary placeholder-black/60"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-fifth" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredGuests.map((guest) => (
              <button
                key={guest.guest_id}
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                  navigate(`/personnel/${guest.guest_id}`);
                }}
                className="w-full text-left px-2 py-1 text-xs leading-[0.75rem] text-fifth font-medium hover:bg-primary transition-colors"
              >
                {guest.guest}
                {guest.guest_instrument && (
                  <span className="text-fifth/70 font-light text-[0.625rem] leading-[0.75rem] ml-2">({guest.guest_instrument})</span>
                )}
              </button>
            ))}
            {filteredGuests.length === 0 && (
              <div className="px-4 py-1 text-xs text-fifth italic">
                No guests found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}