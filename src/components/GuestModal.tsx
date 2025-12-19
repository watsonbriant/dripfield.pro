import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
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

  const handleSubmit = async () => {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-primary border border-fourth w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">
              {isNewGuest ? 'Add New Guest' : 'Edit Guest'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1 px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-fourth"
              >
                <Save className="w-4 h-4" />
                {isSubmitting && <span className="ml-1">...</span>}
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center px-2 py-0.5 bg-fifth hover:bg-red-600 text-red-600 hover:text-fifth transition-colors border border-fourth text-xs font-medium"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-2 py-1">
          {error && (
            <div className="mb-2 px-2 py-0.5 bg-red-500/20 border border-red-500 text-xs text-fifth">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <div>
              <label htmlFor="guest" className="block text-xs font-medium text-fifth mb-0.5">
                Guest Name <span className="text-red-600">*</span>
              </label>
              <input
                id="guest"
                name="guest"
                type="text"
                value={formData.guest}
                onChange={handleInputChange}
                className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                required
              />
            </div>
            
            <div>
              <label htmlFor="guest_displayname" className="block text-xs font-medium text-fifth mb-0.5">
                Display Name
              </label>
              <input
                id="guest_displayname"
                name="guest_displayname"
                type="text"
                value={formData.guest_displayname || ''}
                onChange={handleInputChange}
                className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
              />
            </div>
            
            <div>
              <label htmlFor="guest_instrument" className="block text-xs font-medium text-fifth mb-0.5">
                Instrument
              </label>
              <input
                id="guest_instrument"
                name="guest_instrument"
                type="text"
                value={formData.guest_instrument || ''}
                onChange={handleInputChange}
                className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
              />
            </div>
            
            <div>
              <label htmlFor="guest_category" className="block text-xs font-medium text-fifth mb-0.5">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="guest_category"
                name="guest_category"
                value={formData.guest_category || ''}
                onChange={handleInputChange}
                className="w-full px-2 py-0.5 border font-light border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
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
              <div className="text-xs text-fifth/60 italic">
                Note: Canon ID will be automatically assigned based on the selected category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestModal;