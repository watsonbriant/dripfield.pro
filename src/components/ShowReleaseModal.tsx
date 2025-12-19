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
            // Fetch all releases with pagination
            let allReleases: Release[] = [];
            let releasePage = 0;
            let hasMoreReleases = true;
            const releasePageSize = 1000;

            while (hasMoreReleases) {
                const { data, error } = await supabase
                    .from('releases')
                    .select('release_id, release, release_displayname, release_service')
                    .order('release_displayname', { ascending: true })
                    .range(releasePage * releasePageSize, (releasePage + 1) * releasePageSize - 1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allReleases = [...allReleases, ...data];
                    releasePage++;
                    hasMoreReleases = data.length === releasePageSize;
                } else {
                    hasMoreReleases = false;
                }
            }

            // Get ALL release associations with pagination
            let allShowReleases: { release_id: string }[] = [];
            let associationPage = 0;
            let hasMoreAssociations = true;
            const associationPageSize = 1000;

            while (hasMoreAssociations) {
                const { data, error } = await supabase
                    .from('releases_shows')
                    .select('release_id')
                    .range(associationPage * associationPageSize, (associationPage + 1) * associationPageSize - 1);

                if (error) throw error;
                
                if (data && data.length > 0) {
                    allShowReleases = [...allShowReleases, ...data];
                    associationPage++;
                    hasMoreAssociations = data.length === associationPageSize;
                } else {
                    hasMoreAssociations = false;
                }
            }

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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3">
            <div className="bg-primary border border-fourth w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
                <div className="bg-tertiary text-fifth px-2 py-0.5">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">
                            {mode === 'add' ? 'Add Release to Show' : 'Edit Release Order'}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving || (mode === 'add' && !selectedReleaseId)}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mode === 'add' ? (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-fifth mb-0.5">
                                    Select Release <span className="text-red-600">*</span>
                                </label>
                                {loading ? (
                                    <div className="flex items-center justify-center p-3">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse"></div>
                                            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
                                            <div className="w-3 h-3 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedReleaseId}
                                        onChange={(e) => setSelectedReleaseId(e.target.value)}
                                        className="w-full px-2 py-0.5 bg-canvas font-light text-fifth border border-fourth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary"
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
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-fifth mb-0.5">
                                    Release
                                </label>
                                <input
                                    type="text"
                                    value={existingReleaseId || ''}
                                    disabled
                                    className="w-full px-2 py-0.5 bg-canvas/50 font-light text-fifth/60 border border-fourth text-xs"
                                />
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-fifth mb-0.5">
                                Release Order <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={releaseOrder}
                                onChange={(e) => setReleaseOrder(parseInt(e.target.value) || 1)}
                                className="w-full px-2 py-0.5 bg-canvas font-light text-fifth border border-fourth text-xs focus:outline-none focus:ring-1 focus:ring-tertiary"
                                placeholder="Enter order number"
                            />
                            <p className="text-xs text-fifth/60 mt-0.5">
                                Lower numbers appear first in the list
                            </p>
                        </div>

                        {/* Delete button - only show in edit mode */}
                        {mode === 'edit' && (
                            <div className="md:col-span-2">
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
                                        className="flex items-center gap-1 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white border border-fourth text-xs font-medium transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
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