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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#172330] border border-white/10 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-white/10 p-4">
          <h3 className="text-xl font-semibold text-white">
            {isNewGuest ? 'Add New Guest' : 'Edit Guest'}
          </h3>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white/90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-md text-sm text-red-300">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="guest" className="block text-sm font-semibold text-white">
              Guest Name <span className="text-red-400">*</span>
            </label>
            <input
              id="guest"
              name="guest"
              type="text"
              value={formData.guest}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guest_displayname" className="block text-sm font-semibold text-white">
              Display Name
            </label>
            <input
              id="guest_displayname"
              name="guest_displayname"
              type="text"
              value={formData.guest_displayname || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guest_instrument" className="block text-sm font-semibold text-white">
              Instrument
            </label>
            <input
              id="guest_instrument"
              name="guest_instrument"
              type="text"
              value={formData.guest_instrument || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="guest_category" className="block text-sm font-semibold text-white">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              id="guest_category"
              name="guest_category"
              value={formData.guest_category || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-md border border-tertiary bg-white/10 text-[#fce7ca] focus:outline-none focus:ring-2 focus:ring-tertiary text-sm"
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
            <div className="text-xs text-white/60 italic pt-2">
              Note: Canon ID will be automatically assigned based on the selected category.
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-tertiary text-white hover:bg-tertiary/90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isNewGuest ? 'Add Guest' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestModal;