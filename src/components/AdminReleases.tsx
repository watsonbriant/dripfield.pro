import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ReleaseModal } from './ReleaseModal';

interface Release {
  release_id: string;
  release: string;
  release_displayname: string;
  release_link: string | null;
  release_service: string | null;
  release_artwork: string | null;
}

export function AdminReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  // Function to fetch releases
  const fetchReleases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .order('release_displayname', { ascending: true });

      if (error) throw error;
      if (data) {
        setReleases(data);
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch releases on component mount
  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  // Handle opening modal for edit
  const handleReleaseClick = (release: Release) => {
    setSelectedRelease(release);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  // Handle opening modal for add
  const handleAddNew = () => {
    setSelectedRelease(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRelease(null);
    setIsAddMode(false);
  };

  // Handle save from modal
  const handleModalSave = () => {
    fetchReleases(); // Refresh the list
    handleModalClose();
  };

  // Filter releases for display
  const getFilteredReleases = () => {
    if (!searchQuery) return releases;
    
    const query = searchQuery.toLowerCase();
    return releases.filter(release => 
      release.release_displayname.toLowerCase().includes(query) ||
      release.release.toLowerCase().includes(query) ||
      (release.release_service && release.release_service.toLowerCase().includes(query))
    );
  };

  const filteredReleases = getFilteredReleases();

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-3 lg:mb-0">
          Manage Releases
        </h2>
        
        <div className="flex gap-3 w-full lg:w-auto lg:justify-end">
          {/* Search input */}
          <div className="relative flex-1 lg:flex-initial">
            <input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-canvas text-black border border-black rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary w-full lg:w-48"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black/50 w-4 h-4" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black/50 hover:text-black p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Add new button */}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white border border-black rounded-lg text-sm hover:bg-green-600/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Release</span>
          </button>
        </div>
      </div>

      <div className="mb-3 text-black text-xs lg:text-sm">
        Click on any release to view and edit its details.
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading releases...</p>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-canvas border-y border-white/10">
                <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                  Display Name
                </th>
                <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                  Service
                </th>
                <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                  Release
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReleases.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-black">
                    {searchQuery ? 'No releases matching your search' : 'No releases found'}
                  </td>
                </tr>
              ) : (
                filteredReleases.map((release, index) => (
                  <tr
                    key={release.release_id}
                    className={`${
                      index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-black/10 transition-colors text-xs cursor-pointer`}
                    onClick={() => handleReleaseClick(release)}
                  >
                    <td className="px-4 py-1 text-black">
                      <span className="font-semibold hover:text-[#a9682e] transition-colors">
                        {release.release_displayname}
                      </span>
                    </td>
                    <td className="px-4 py-1 text-black">
                      {release.release_service || '-'}
                    </td>
                    <td className="px-4 py-1 text-black">
                      {release.release}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Release Modal */}
      <ReleaseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        release={selectedRelease}
        isAddMode={isAddMode}
      />
    </>
  );
}