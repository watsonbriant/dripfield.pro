import React, { useEffect, useState } from 'react';
import { BugIcon, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Component for copying email to clipboard with feedback
function CopyToClipboard({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation(); // Prevent row click event
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`hover:underline cursor-pointer ${
        copied ? 'text-green-400' : 'text-blue-400'
      }`}
      title="Click to copy to clipboard"
    >
      {copied ? 'Copied to clipboard!' : text}
    </button>
  );
}

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, bug }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#172330] border border-white/20 rounded-lg p-5 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Resolve Bug</h3>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-[#fce7ca]/90 mb-2">Has this bug been resolved?</p>
          <div className="bg-[#0e151b] p-3 rounded border border-white/10 text-[#fce7ca]/70 text-sm">
            <p className="font-semibold text-[#fce7ca]/90 mb-1">{bug?.bug_type}</p>
            <p>{bug?.bug_detail}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors text-sm"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-600 transition-colors text-sm"
          >
            Yes, Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

export function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBug, setSelectedBug] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchBugs();

    // Set up realtime subscription
    const subscription = supabase
      .channel('bugs-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bugs' },
        payload => {
          console.log('Bug table change detected:', payload);
          fetchBugs(); // Refetch all bugs on any change
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('bugs')
        .select('bug_id, bug_type, bug_submissiondate, bug_contactemail, bug_detail, bug_completion')
        .order('bug_submissiondate', { ascending: false });

      if (error) {
        throw error;
      }

      setBugs(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (bug) => {
    if (bug.bug_completion) return; // Don't open modal for already resolved bugs
    setSelectedBug(bug);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBug(null);
  };

  const markAsResolved = async () => {
    if (!selectedBug) return;
    
    try {
      setUpdating(true);
      
      // Update the bug in Supabase
      const { error } = await supabase
        .from('bugs')
        .update({ bug_completion: true })
        .eq('bug_id', selectedBug.bug_id);
      
      if (error) throw error;
      
      // Update the local state to reflect the change
      setBugs(bugs.map(bug => 
        bug.bug_id === selectedBug.bug_id 
          ? { ...bug, bug_completion: true } 
          : bug
      ));
      
      // Log success to confirm the update happened
      console.log(`Bug ${selectedBug.bug_id} marked as resolved`);
      
      handleModalClose();
    } catch (err) {
      setError('Failed to update bug: ' + err.message);
      console.error('Error updating bug:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Bug Tracker</h1>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-[#fce7ca]/70 mt-4">Loading bugs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-400 mr-2" />
            <p className="text-white">Error loading bugs: {error}</p>
          </div>
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#fce7ca]/70">No bugs have been reported yet.</p>
        </div>
      ) : (
        <div className="bg-[#172330] border border-white/10 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-white/90 mb-4">
            Bug Reports
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-[#0e151b] border-y border-white/10">
                  <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">
                    Contact Email
                  </th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">
                    Details
                  </th>
                  <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bugs.map((bug, index) => (
                  <tr 
                    key={bug.bug_id || index} 
                    className={`${
                      index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                    } hover:bg-white/10 transition-colors text-xs ${
                      bug.bug_completion ? 'opacity-50' : 'cursor-pointer'
                    }`}
                    onClick={() => handleRowClick(bug)}
                  >
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap font-semibold">
                      {bug.bug_type || 'N/A'}
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                      {formatDate(bug.bug_submissiondate)}
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                      {bug.bug_contactemail ? (
                        <CopyToClipboard text={bug.bug_contactemail} />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-1 text-[#fce7ca]/70">
                      <div className="max-w-[350px] break-words whitespace-normal">
                        {bug.bug_detail || 'No details provided'}
                      </div>
                    </td>
                    <td className="px-4 py-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        bug.bug_completion 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-amber-900/50 text-amber-300'
                      }`}>
                        {bug.bug_completion ? 'Resolved' : 'Open'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <ConfirmationModal 
        isOpen={modalOpen} 
        onClose={handleModalClose} 
        onConfirm={markAsResolved}
        bug={selectedBug}
      />
    </div>
  );
}