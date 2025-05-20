import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GuestData {
  guest: string;
  guest_id: string;
  guest_displayname: string | null;
  guest_instrument: string | null;
  guest_category: string | null;
  guest_canonid: number | null;
}

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GuestData | null;
  onSave: () => void;
  isNewGuest: boolean;
}

const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  guest,
  onSave,
  isNewGuest
}) => {
  const [formData, setFormData] = useState<Partial<GuestData>>({
    guest: '',
    guest_displayname: '',
    guest_instrument: '',
    guest_category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const guestCategories = [
    "Goose (current)",
    "Goose (former)",
    "Group",
    "Guest"
  ];

  useEffect(() => {
    if (isOpen) {
      if (isNewGuest) {
        setFormData({
          guest: '',
          guest_displayname: '',
          guest_instrument: '',
          guest_category: '',
        });
        setError(null);
      } else if (guest) {
        setFormData({
          guest: guest.guest || '',
          guest_displayname: guest.guest_displayname || '',
          guest_instrument: guest.guest_instrument || '',
          guest_category: guest.guest_category || '',
        });
        setError(null);
      }
    }
  }, [isOpen, isNewGuest, guest]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.guest) {
        throw new Error('Guest name is required');
      }
      
      if (!formData.guest_category) {
        throw new Error('Category is required');
      }

      // If it's a new guest, we need to determine the next guest_canonid
      if (isNewGuest) {
        // First, get the highest guest_canonid for the selected category
        const { data: highestCanonIdData, error: fetchError } = await supabase
          .from('guests')
          .select('guest_canonid')
          .eq('guest_category', formData.guest_category)
          .order('guest_canonid', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        // Calculate the next canonid
        const nextCanonId = highestCanonIdData && highestCanonIdData.length > 0 && highestCanonIdData[0].guest_canonid 
          ? highestCanonIdData[0].guest_canonid + 1 
          : 1;

        // Insert new guest with the calculated canonid
        const { error: insertError } = await supabase
          .from('guests')
          .insert({
            guest: formData.guest,
            guest_displayname: formData.guest_displayname || null,
            guest_instrument: formData.guest_instrument || null,
            guest_category: formData.guest_category,
            guest_canonid: nextCanonId
          });

        if (insertError) throw insertError;
      } else if (guest) {
        // Update existing guest
        const { error: updateError } = await supabase
          .from('guests')
          .update({
            guest: formData.guest,
            guest_displayname: formData.guest_displayname || null,
            guest_instrument: formData.guest_instrument || null,
            guest_category: formData.guest_category
          })
          .eq('guest_id', guest.guest_id);

        if (updateError) throw updateError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving guest:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] bottom-4 md:top-20 md:bottom-auto md:max-w-md md:w-full z-50 bg-primary rounded-lg border border-black shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
            {isNewGuest ? 'Add New Guest' : 'Edit Guest'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-black bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-sm text-black">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="guest" className="block text-sm font-semibold text-black">
                Guest Name <span className="text-red-600">*</span>
              </label>
              <input
                id="guest"
                name="guest"
                type="text"
                value={formData.guest}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="guest_displayname" className="block text-sm font-semibold text-black">
                Display Name
              </label>
              <input
                id="guest_displayname"
                name="guest_displayname"
                type="text"
                value={formData.guest_displayname || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="guest_instrument" className="block text-sm font-semibold text-black">
                Instrument
              </label>
              <input
                id="guest_instrument"
                name="guest_instrument"
                type="text"
                value={formData.guest_instrument || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="guest_category" className="block text-sm font-semibold text-black">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="guest_category"
                name="guest_category"
                value={formData.guest_category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-black bg-white text-black focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
                required
              >
                <option value="">-- Select Category --</option>
                {guestCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {isNewGuest && (
              <div className="text-xs text-black italic pt-2">
                Note: Canon ID will be automatically assigned based on the selected category.
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-black bg-white text-black hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-black bg-[#f9ae37] text-black hover:bg-tertiary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : isNewGuest ? 'Add Guest' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default GuestModal;