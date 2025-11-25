import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShowData {
  show_id: string;
  show_date: string;
  show_canonid: number | null;
  show_group: string;
  show_tour: string;
  show_subvenue: string;
  show_subvenue_venue: string | null;
  show_venue_location: string | null;
  show_iscanon: boolean;
  show_year: string;
  show_issetlistgame: boolean;
  show_detail: string | null;
}

interface GroupData {
  group: string;
}

interface TourData {
  tour: string;
  tour_canonid: number;
}

interface SubvenueData {
  subvenue: string;
  subvenue_venue_location: string | null;
}

interface YearData {
  year: string;
}

interface ShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: ShowData | null;
  onSave: () => void;
  isNewShow: boolean;
  groups: GroupData[];
  tours: TourData[];
  subvenues: SubvenueData[];
  years: YearData[];
}

const ShowModal: React.FC<ShowModalProps> = ({
  isOpen,
  onClose,
  show,
  onSave,
  isNewShow,
  groups,
  tours,
  subvenues,
  years
}) => {
  const [formData, setFormData] = useState<Partial<ShowData>>({
    show_date: '',
    show_group: '',
    show_tour: '',
    show_subvenue: '',
    show_iscanon: false,
    show_year: '',
    show_issetlistgame: false,
    show_detail: null
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isNewShow) {
      setFormData({
        show_date: '',
        show_group: '',
        show_tour: '',
        show_subvenue: '',
        show_iscanon: false,
        show_year: '',
        show_issetlistgame: false,
        show_detail: null
      });
    } else if (show) {
      setFormData(show);
    }
    setErrors({});
  }, [show, isNewShow, isOpen]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.show_date) {
      newErrors.show_date = 'Date is required';
    }
    if (!formData.show_group) {
      newErrors.show_group = 'Group is required';
    }
    if (!formData.show_tour) {
      newErrors.show_tour = 'Tour is required';
    }
    if (!formData.show_subvenue) {
      newErrors.show_subvenue = 'Subvenue is required';
    }
    if (!formData.show_year) {
      newErrors.show_year = 'Year is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? null : value)
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isNewShow) {
        // Ensure date is in YYYY-MM-DD format
        const showData = {
          show_date: formData.show_date,
          show_group: formData.show_group,
          show_tour: formData.show_tour,
          show_subvenue: formData.show_subvenue,
          show_iscanon: formData.show_iscanon || false,
          show_year: formData.show_year,
          show_issetlistgame: formData.show_issetlistgame || false,
          show_detail: formData.show_detail
        };
        
        const { error } = await supabase
          .from('shows')
          .insert([showData]);
        
        if (error) throw error;
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving show:', error);
      setErrors({ submit: 'Failed to save show. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-fourth">
        <div className="sticky top-0 bg-primary border-b border-fourth p-3 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-fifth">
            {isNewShow ? 'Add New Show' : 'Edit Show'}
          </h2>
          <button
            onClick={onClose}
            className="text-fifth bg-red-600 p-2 rounded-lg border border-fourth hover:bg-red-600/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-3 space-y-4">
          {errors.submit && (
            <div className="text-red-600 text-sm bg-red-100 px-2 py-1.5 rounded-md">
              {errors.submit}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="show_date"
                value={formData.show_date || ''}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 font-light rounded-md border ${
                  errors.show_date ? 'border-red-500' : 'border-secondary'
                } bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
              />
              {errors.show_date && (
                <p className="text-red-500 text-xs mt-1">{errors.show_date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">
                Group <span className="text-red-500">*</span>
              </label>
              <select
                name="show_group"
                value={formData.show_group || ''}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 font-light rounded-md border ${
                  errors.show_group ? 'border-red-500' : 'border-secondary'
                } bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
              >
                <option value="">-- Select Group --</option>
                {groups.map((group) => (
                  <option key={group.group} value={group.group}>
                    {group.group}
                  </option>
                ))}
              </select>
              {errors.show_group && (
                <p className="text-red-500 text-xs mt-1">{errors.show_group}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">
                Tour <span className="text-red-500">*</span>
              </label>
              <select
                name="show_tour"
                value={formData.show_tour || ''}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 font-light rounded-md border ${
                  errors.show_tour ? 'border-red-500' : 'border-secondary'
                } bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
              >
                <option value="">-- Select Tour --</option>
                {tours.map((tour) => (
                  <option key={tour.tour} value={tour.tour}>
                    {tour.tour}
                  </option>
                ))}
              </select>
              {errors.show_tour && (
                <p className="text-red-500 text-xs mt-1">{errors.show_tour}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">
                Subvenue <span className="text-red-500">*</span>
              </label>
              <select
                name="show_subvenue"
                value={formData.show_subvenue || ''}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 font-light rounded-md border ${
                  errors.show_subvenue ? 'border-red-500' : 'border-secondary'
                } bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
              >
                <option value="">-- Select Subvenue --</option>
                {subvenues.map((subvenue) => (
                  <option key={subvenue.subvenue} value={subvenue.subvenue}>
                    {subvenue.subvenue} {subvenue.subvenue_venue_location && `- ${subvenue.subvenue_venue_location}`}
                  </option>
                ))}
              </select>
              {errors.show_subvenue && (
                <p className="text-red-500 text-xs mt-1">{errors.show_subvenue}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_iscanon"
                  checked={formData.show_iscanon || false}
                  onChange={handleChange}
                  className="rounded border-fourth focus:ring-fourth"
                />
                Is Canon?
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_issetlistgame"
                  checked={formData.show_issetlistgame || false}
                  onChange={handleChange}
                  className="rounded border-fourth focus:ring-fourth"
                />
                Is Setlist Game?
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-fifth">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="show_year"
                value={formData.show_year || ''}
                onChange={handleChange}
                className={`w-full px-2 py-1.5 font-light rounded-md border ${
                  errors.show_year ? 'border-red-500' : 'border-secondary'
                } bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm`}
              >
                <option value="">-- Select Year --</option>
                {years.map((year) => (
                  <option key={year.year} value={year.year}>
                    {year.year}
                  </option>
                ))}
              </select>
              {errors.show_year && (
                <p className="text-red-500 text-xs mt-1">{errors.show_year}</p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-fifth">
                Detail (Optional)
              </label>
              <textarea
                name="show_detail"
                value={formData.show_detail || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-2 py-1.5 font-light rounded-md border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-fourth text-sm"
                placeholder="Enter any additional details..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-fifth bg-canvas hover:bg-black/30 rounded-md transition-colors border border-fourth"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShowModal;