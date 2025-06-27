import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Release {
    release_id: string;
    release: string;
    release_displayname: string;
    release_service: string | null;
}

interface ShowReleaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    showId: string;
    mode: 'add' | 'edit';
    existingReleaseId?: string;
    existingOrder?: number;
}

export function ShowReleaseModal({
    isOpen,
    onClose,
    onSave,
    showId,
    mode,
    existingReleaseId,
    existingOrder
}: ShowReleaseModalProps) {
    const [availableReleases, setAvailableReleases] = useState<Release[]>([]);
    const [allAssociatedReleaseIds, setAllAssociatedReleaseIds] = useState<Set<string>>(new Set());
    const [selectedReleaseId, setSelectedReleaseId] = useState<string>(existingReleaseId || '');
    const [releaseOrder, setReleaseOrder] = useState<number>(existingOrder || 1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && mode === 'add') {
            fetchAvailableReleases();
        }
        if (mode === 'edit' && existingReleaseId && existingOrder !== undefined) {
            setSelectedReleaseId(existingReleaseId);
            setReleaseOrder(existingOrder);
        }
    }, [isOpen, mode, existingReleaseId, existingOrder]);

    const fetchAvailableReleases = async () => {
        setLoading(true);
        try {
            // First get all releases
            const { data: allReleases, error: releasesError } = await supabase
                .from('releases')
                .select('release_id, release, release_displayname, release_service')
                .order('release_displayname', { ascending: true });

            if (releasesError) throw releasesError;

            // Get ALL release associations (not just for this show)
            const { data: allShowReleases, error: allShowReleasesError } = await supabase
                .from('releases_shows')
                .select('release_id');

            if (allShowReleasesError) throw allShowReleasesError;

            // Get releases already associated with THIS show
            const { data: thisShowReleases, error: thisShowReleasesError } = await supabase
                .from('releases_shows')
                .select('release_id')
                .eq('show_id', showId);

            if (thisShowReleasesError) throw thisShowReleasesError;

            // Create sets for easier lookup
            const allAssociatedIds = new Set(allShowReleases?.map(r => r.release_id) || []);
            const thisShowReleaseIds = new Set(thisShowReleases?.map(r => r.release_id) || []);

            // Filter out releases already associated with THIS show
            const availableReleases = allReleases?.filter(r => !thisShowReleaseIds.has(r.release_id)) || [];

            // Sort: unassociated releases first, then releases associated with other shows
            const sortedReleases = availableReleases.sort((a, b) => {
                const aIsAssociated = allAssociatedIds.has(a.release_id);
                const bIsAssociated = allAssociatedIds.has(b.release_id);
                
                // Generate display strings for sorting
                const aDisplay = a.release_service ? `${a.release_service} - ${a.release}` : a.release;
                const bDisplay = b.release_service ? `${b.release_service} - ${b.release}` : b.release;
                
                // If one is associated and the other isn't, put the unassociated one first
                if (!aIsAssociated && bIsAssociated) return -1;
                if (aIsAssociated && !bIsAssociated) return 1;
                
                // If both are in the same category, sort by display string
                return aDisplay.localeCompare(bDisplay);
            }); 

            setAvailableReleases(sortedReleases);
            setAllAssociatedReleaseIds(allAssociatedIds);
        } catch (err) {
            console.error('Error fetching available releases:', err);
            setError('Failed to load available releases');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedReleaseId || !releaseOrder) {
            setError('Please select a release and enter an order number');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            if (mode === 'add') {
                // Insert new release association
                const { error } = await supabase
                    .from('releases_shows')
                    .insert({
                        release_id: selectedReleaseId,
                        show_id: showId,
                        release_order: releaseOrder
                    });

                if (error) throw error;
            } else {
                // Update existing release association
                const { error } = await supabase
                    .from('releases_shows')
                    .update({
                        release_order: releaseOrder
                    })
                    .eq('release_id', existingReleaseId)
                    .eq('show_id', showId);

                if (error) throw error;
            }

            onSave();
        } catch (err) {
            console.error('Error saving release association:', err);
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingReleaseId) return;

        setDeleting(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('releases_shows')
                .delete()
                .eq('release_id', existingReleaseId)
                .eq('show_id', showId);

            if (error) throw error;

            onSave();
        } catch (err) {
            console.error('Error deleting release association:', err);
            setError('Failed to delete. Please try again.');
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
            <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] md:top-20 md:max-w-[500px] md:w-full max-h-[calc(100vh-88px)] md:max-h-[calc(100vh-100px)] overflow-y-auto z-50 bg-primary rounded-lg border border-black shadow-xl flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-black/10 bg-canvas rounded-t-lg">
                    <h2 className="text-xl font-mohr bg-[#f9ae37] text-black inline-block px-3 pt-1.5 pb-0.5 rounded-full border border-black">
                        {mode === 'add' ? 'Add Release to Show' : 'Edit Release Order'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-tertiary rounded-lg border border-black bg-red-500 transition-colors"
                    >
                        <X className="w-5 h-5 text-black" />
                    </button>
                </div>

                <div className="p-4">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {mode === 'add' ? (
                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Select Release <span className="text-red-500">*</span>
                                </label>
                                {loading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedReleaseId}
                                        onChange={(e) => setSelectedReleaseId(e.target.value)}
                                        className="w-full px-3 py-2 bg-canvas text-black border border-black rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                                    >
                                        <option value="">-- Select a release --</option>
                                        {availableReleases.map((release, index) => {
                                            // Check if this is the first release that's associated with other shows
                                            const isFirstAssociated = index > 0 &&
                                                !allAssociatedReleaseIds.has(availableReleases[index - 1].release_id) &&
                                                allAssociatedReleaseIds.has(release.release_id);

                                            return (
                                                <React.Fragment key={release.release_id}>
                                                    {isFirstAssociated && (
                                                        <option disabled>──────── Already in other shows ────────</option>
                                                    )}
                                                    <option value={release.release_id}>
                                                        {release.release_service ? `${release.release_service} - ${release.release}` : release.release}
                                                    </option>
                                                </React.Fragment>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-semibold text-black mb-1">
                                    Release
                                </label>
                                <input
                                    type="text"
                                    value={existingReleaseId || ''}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-black mb-1">
                                Release Order <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={releaseOrder}
                                onChange={(e) => setReleaseOrder(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 bg-canvas text-black border border-black rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-tertiary"
                                placeholder="Enter order number"
                            />
                            <p className="text-xs text-black/60 mt-1">
                                Lower numbers appear first in the list
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black/10 p-4 bg-canvas rounded-b-lg flex justify-between">
                    {/* Delete button - only show in edit mode */}
                    {mode === 'edit' && (
                        <div>
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-black">Are you sure?</span>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-black text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg border border-black text-sm font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-black font-bold transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving || (mode === 'add' && !selectedReleaseId)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-black font-bold transition-colors ${saving || (mode === 'add' && !selectedReleaseId)
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            } ${mode === 'add' ? 'ml-auto' : ''}`}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );
}