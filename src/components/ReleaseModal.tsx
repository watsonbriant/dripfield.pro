import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Release {
  release_id: string;
  release: string;
  release_displayname: string;
  release_link: string | null;
  release_service: string | null;
  release_artwork: string | null;
}

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  release: Release | null;
  isAddMode: boolean;
}

export function ReleaseModal({
  isOpen,
  onClose,
  onSave,
  release,
  isAddMode
}: ReleaseModalProps) {
  const [formData, setFormData] = useState<Omit<Release, 'release_id'>>({
    release: '',
    release_displayname: '',
    release_link: '',
    release_service: '',
    release_artwork: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Update form data when release changes
  useEffect(() => {
    if (release && !isAddMode) {
      setFormData({
        release: release.release,
        release_displayname: release.release_displayname,
        release_link: release.release_link || '',
        release_service: release.release_service || '',
        release_artwork: release.release_artwork || ''
      });
    } else if (isAddMode) {
      // Reset form for add mode
      setFormData({
        release: '',
        release_displayname: '',
        release_link: '',
        release_service: '',
        release_artwork: ''
      });
    }
  }, [release, isAddMode]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.release || !formData.release_displayname) {
      setError('Release and Display Name are required fields');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isAddMode) {
        // Insert new release
        const { error } = await supabase
          .from('releases')
          .insert([{
            release: formData.release,
            release_displayname: formData.release_displayname,
            release_link: formData.release_link || null,
            release_service: formData.release_service || null,
            release_artwork: formData.release_artwork || null
          }]);

        if (error) throw error;
      } else if (release) {
        // Update existing release
        const { error } = await supabase
          .from('releases')
          .update({
            release: formData.release,
            release_displayname: formData.release_displayname,
            release_link: formData.release_link || null,
            release_service: formData.release_service || null,
            release_artwork: formData.release_artwork || null
          })
          .eq('release_id', release.release_id);

        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error('Error saving release:', err);
      setError('Failed to save release. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!release) return;
    
    setDeleting(true);
    setError(null);

    try {
        const { error } = await supabase
        .from('releases')
        .delete()
        .eq('release_id', release.release_id);

        if (error) throw error;
        
        onSave(); // This will refresh the list
    } catch (err) {
        console.error('Error deleting release:', err);
        setError('Failed to delete release. Please try again.');
    } finally {
        setDeleting(false);
        setShowDeleteConfirm(false);
    }
    };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
      <div className="bg-primary border border-fourth w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="bg-tertiary text-fifth px-2 py-0.5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">
              {isAddMode ? 'Add New Release' : 'Edit Release'}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-fourth"
              >
                <Save className="w-4 h-4" />
                {saving && <span className="ml-1">...</span>}
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
            {!isAddMode && release && (
              <div>
                <label className="block text-xs font-medium text-fifth mb-0.5">
                  Release ID
                </label>
                <input
                  type="text"
                  value={release.release_id}
                  disabled
                  className="w-full px-2 py-0.5 bg-canvas/50 text-fifth/60 border border-fourth text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">
                Release <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.release}
                onChange={(e) => handleInputChange('release', e.target.value)}
                className="w-full px-2 py-0.5 font-light bg-canvas text-fifth border border-fourth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary"
                placeholder="Enter release name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">
                Display Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.release_displayname}
                onChange={(e) => handleInputChange('release_displayname', e.target.value)}
                className="w-full px-2 py-0.5 font-light bg-canvas text-fifth border border-fourth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary"
                placeholder="Enter display name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fifth mb-0.5">
                Release Link
              </label>
              <input
                type="text"
                value={formData.release_link}
                onChange={(e) => handleInputChange('release_link', e.target.value)}
                className="w-full px-2 py-0.5 font-light bg-canvas text-fifth border border-fourth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary"
                placeholder="Enter release link URL"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-medium text-fifth">
                  Service
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.release_link) {
                      const link = formData.release_link.toLowerCase();
                      let service = '';
                      
                      if (link.includes('bandcamp.com')) {
                        service = 'Bandcamp';
                      } else if (link.includes('youtube.com')) {
                        service = 'YouTube';
                      } else if (link.includes('nugsnet')) {
                        service = 'nugs';
                      } else if (link.includes('spotify.com')) {
                        service = 'Spotify';
                      }
                      
                      if (service) {
                        handleInputChange('release_service', service);
                      }
                    }
                  }}
                  className="text-xs px-2 py-0.5 bg-blue-500 font-medium hover:bg-blue-600 text-white border border-fourth transition-colors"
                >
                  Auto-detect Service
                </button>
              </div>
              <input
                type="text"
                value={formData.release_service}
                onChange={(e) => handleInputChange('release_service', e.target.value)}
                className="w-full px-2 py-0.5 font-light bg-canvas text-fifth border border-fourth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary"
                placeholder="Enter service name (e.g., Spotify, Apple Music)"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-xs font-medium text-fifth">
                  Artwork URL
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.release_link && formData.release_link.length >= 11) {
                      const videoId = formData.release_link.slice(-11);
                      handleInputChange('release_artwork', `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
                    }
                  }}
                  className="text-xs px-2 py-0.5 bg-blue-500 font-medium hover:bg-blue-600 text-white border border-fourth transition-colors"
                >
                  YouTube Thumbnail
                </button>
              </div>
              <input
                type="text"
                value={formData.release_artwork}
                onChange={(e) => handleInputChange('release_artwork', e.target.value)}
                className="w-full px-2 py-0.5 font-light bg-canvas text-fifth border border-fourth text-xs focus:outline-none focus:ring-2 focus:ring-tertiary"
                placeholder="Enter artwork URL"
              />
              {formData.release_artwork && (
                <div className="mt-1">
                  <img 
                    src={formData.release_artwork} 
                    alt="Release artwork preview" 
                    className="h-32 object-cover border border-fourth"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Delete button - only show in edit mode */}
            {!isAddMode && release && (
              <div>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-fifth">Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white border border-fourth text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-0.5 bg-canvas hover:bg-tertiary text-fifth border border-fourth text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white border border-fourth text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}