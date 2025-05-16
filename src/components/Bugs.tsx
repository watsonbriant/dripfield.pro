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
        copied ? 'text-green-700' : 'text-[#a9682e]'
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
      <div className="bg-primary border border-black rounded-lg p-4 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Resolve Bug</h3>
          <button 
            onClick={onClose}
            className="text-black hover:text-[#a9682e]"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-black mb-2">Has this bug been resolved?</p>
          <div className="bg-canvas p-3 rounded border border-black text-black text-sm">
            <p className="font-semibold mb-1">{bug?.bug_type}</p>
            <p>{bug?.bug_detail}</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-black text-black hover:bg-canvas transition-colors text-sm"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-[#f9ae37] text-black hover:bg-[#e29d26] transition-colors text-sm border border-black"
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
        <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black">Bug Tracker</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#f9ae37] animate-pulse delay-300"></div>
          </div>
          <p className="text-black mt-4">Loading bugs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-700 mr-2" />
            <p className="text-red-800">Error loading bugs: {error}</p>
          </div>
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-black">No bugs have been reported yet.</p>
        </div>
      ) : (
        <div className="bg-primary border border-black rounded-lg p-3">
          <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1 pb-0.5 rounded-full border border-black mb-2">
            Bug Reports
          </h2>
          <div className="overflow-x-auto relative">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="bg-canvas border-y border-white/10">
                  <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                    Type
                  </th>
                  <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                    Submitted
                  </th>
                  <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                    Contact Email
                  </th>
                  <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                    Details
                  </th>
                  <th className="px-4 py-1 text-left text-s font-semibold text-black whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bugs.map((bug, index) => (
                  <tr 
                    key={bug.bug_id || index} 
                    className={`${
                      index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                    } hover:bg-black/10 transition-colors text-xs ${
                      bug.bug_completion ? 'opacity-60' : 'cursor-pointer'
                    }`}
                    onClick={() => handleRowClick(bug)}
                  >
                    <td className="px-4 py-0.5 text-black whitespace-nowrap font-semibold">
                      {bug.bug_type || 'N/A'}
                    </td>
                    <td className="px-4 py-0.5 text-black whitespace-nowrap">
                      {formatDate(bug.bug_submissiondate)}
                    </td>
                    <td className="px-4 py-0.5 font-semibold whitespace-nowrap">
                      {bug.bug_contactemail ? (
                        <CopyToClipboard text={bug.bug_contactemail} />
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-4 py-0.5 text-black">
                      <div className="max-w-[350px] break-words whitespace-normal">
                        {bug.bug_detail || 'No details provided'}
                      </div>
                    </td>
                    <td className="px-4 py-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        bug.bug_completion 
                          ? 'bg-green-100 text-green-800 border border-green-800' 
                          : 'bg-amber-100 text-amber-800 border border-amber-800'
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