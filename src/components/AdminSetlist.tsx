import React, { useState } from 'react';
import SetlistEntryModal from './SetlistEntryModal';
import { MainHeader } from './setlist/MainHeader';
import { ShowHeader } from './setlist/ShowHeader';
import { SetlistTable } from './setlist/SetlistTable';
import { useAdminSetlist } from '../hooks/useAdminSetlist';
import { SetlistEntryData } from '../types/setlist';

export const AdminSetlist: React.FC = () => {
  const {
    shows,
    setlistEntries,
    selectedShow,
    loading,
    loadingProgress,
    handleShowSelect,
    fetchSetlistEntries
  } = useAdminSetlist();
  
  const [selectedEntry, setSelectedEntry] = useState<SetlistEntryData | null>(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');


  // Handle setlist entry selection for editing
  const handleEntrySelect = (entry: SetlistEntryData) => {
    setSelectedEntry(entry);
    setIsNewEntry(false);
    setIsEntryModalOpen(true);
  };

  // Handle creating a new setlist entry
  const handleCreateNewEntry = () => {
    if (!selectedShow) return;
    
    const newEntry: SetlistEntryData = {
      entry_id: '', 
      entry_set: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_set : '',
      entry_setnum: setlistEntries.length > 0 ? setlistEntries[setlistEntries.length - 1].entry_setnum + 1 : 1,
      entry_setorder: 0,
      entry_song: '',
      entry_short: null,
      entry_segue: null,
      entry_length: null,
      entry_placement: null,
      entry_coachnotes: null,
      entry_new: 'FALSE',
      entry_show: selectedShow.show_id
    };
    
    setSelectedEntry(newEntry);
    setIsNewEntry(true);
    setIsEntryModalOpen(true);
  };

  // Handle saving an entry - this ensures the table refreshes when an entry is added or edited
  const handleSaveEntry = () => {
    if (selectedShow) {
      fetchSetlistEntries(selectedShow.show_id);
    }
    setIsEntryModalOpen(false);
    
    // Don't automatically reset status - let the save operation handle it
    // The status will be updated by handleSaveStatusUpdate from the modal
  };
  
  // Handle save status updates from modal
  const handleSaveStatusUpdate = (status: 'idle' | 'processing' | 'done' | 'error') => {
    setSaveStatus(status);
    
    // If status is 'done', reset to 'idle' after 2 seconds
    if (status === 'done') {
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }
  };

  return (
    <div>
      <MainHeader
        saveStatus={saveStatus}
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={handleShowSelect}
        selectedShow={selectedShow}
      />

      {selectedShow && (
        <div>
          <ShowHeader
            selectedShow={selectedShow}
            onCreateNewEntry={handleCreateNewEntry}
          />
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-lg h-8 w-8 border-t-2 border-b-2 border-fourth"></div>
            </div>
          ) : (
            <>
              {setlistEntries.length > 0 ? (
                <SetlistTable
                  setlistEntries={setlistEntries}
                  onEntrySelect={handleEntrySelect}
                />
              ) : (
                <div className="bg-primary border border-fourth rounded-lg p-3 text-center">
                  <p className="text-fifth text-xs">No setlist entries found for this show.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedShow && !loading && (
        <div className="bg-primary border border-fourth rounded-lg p-3 text-center">
          <p className="text-fifth text-xs">Select a show to view its setlist.</p>
        </div>
      )}

      {loading && loadingProgress < 100 && !selectedShow && (
        <div className="flex flex-col justify-center items-center h-56">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth text-xs mt-4">Loading shows ({Math.round(loadingProgress)}%)</p>
        </div>
      )}

      <SetlistEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        entry={selectedEntry}
        onSave={handleSaveEntry}
        onSaveStatusUpdate={handleSaveStatusUpdate}
        isNewEntry={isNewEntry}
      />
    </div>
  );
};

export default AdminSetlist;