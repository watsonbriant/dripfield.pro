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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[650px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-fourth shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-fourth/10 bg-canvas rounded-t-lg">
          <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-fourth">
            {isAddMode ? 'Add New Release' : 'Edit Release'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-fourth bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>
        
        <div className="p-3">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {!isAddMode && release && (
              <div>
                <label className="block text-sm font-medium text-fifth mb-1">
                  Release ID
                </label>
                <input
                  type="text"
                  value={release.release_id}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-fifth mb-1">
                Release <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.release}
                onChange={(e) => handleInputChange('release', e.target.value)}
                className="w-full px-2 py-1.5 font-light bg-canvas text-fifth border border-fourth rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                placeholder="Enter release name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fifth mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.release_displayname}
                onChange={(e) => handleInputChange('release_displayname', e.target.value)}
                className="w-full px-2 py-1.5 font-light bg-canvas text-fifth border border-fourth rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                placeholder="Enter display name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fifth mb-1">
                Release Link
              </label>
              <input
                type="text"
                value={formData.release_link}
                onChange={(e) => handleInputChange('release_link', e.target.value)}
                className="w-full px-2 py-1.5 font-light bg-canvas text-fifth border border-fourth rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                placeholder="Enter release link URL"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-fifth">
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
                  className="text-xs px-2 py-1 bg-blue-500 font-medium hover:bg-blue-600 text-white rounded border border-fourth transition-colors"
                >
                  Auto-detect Service
                </button>
              </div>
              <input
                type="text"
                value={formData.release_service}
                onChange={(e) => handleInputChange('release_service', e.target.value)}
                className="w-full px-2 py-1.5 font-light bg-canvas text-fifth border border-fourth rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                placeholder="Enter service name (e.g., Spotify, Apple Music)"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-fifth">
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
                  className="text-xs px-2 py-1 bg-blue-500 font-medium hover:bg-blue-600 text-white rounded border border-fourth transition-colors"
                >
                  YouTube Thumbnail
                </button>
              </div>
              <input
                type="text"
                value={formData.release_artwork}
                onChange={(e) => handleInputChange('release_artwork', e.target.value)}
                className="w-full px-2 py-1.5 font-light bg-canvas text-fifth border border-fourth rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                placeholder="Enter artwork URL"
              />
              {formData.release_artwork && (
                <div className="mt-2">
                  <img 
                    src={formData.release_artwork} 
                    alt="Release artwork preview" 
                    className="h-32 object-cover rounded-lg border border-fourth"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-fourth/10 p-3 bg-canvas rounded-b-lg flex justify-between">
        {/* Delete button - only show in edit mode */}
        {!isAddMode && release && (
            <div>
            {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                <span className="text-sm text-fifth">Are you sure?</span>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-fourth text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg border border-fourth text-sm font-semibold transition-colors"
                >
                    Cancel
                </button>
                </div>
            ) : (
                <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-fourth font-bold transition-colors"
                >
                Delete
                </button>
            )}
            </div>
        )}
        
        {/* Save button - move to the right when delete is shown */}
        <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-fourth font-medium transition-colors ${
            saving 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            } ${!isAddMode && release ? '' : 'mx-auto'}`}
        >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
        </button>
        </div>
      </div>
    </>
  );
}