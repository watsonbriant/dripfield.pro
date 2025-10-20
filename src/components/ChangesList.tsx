import React from 'react';
import { ShowChange } from '../types/showChanges';
import { getChangeIcon, renderChangeText } from '../utils/showChangesHelpers';

interface ChangesListProps {
    changes: ShowChange[];
}

export default function ChangesList({ changes }: ChangesListProps) {
    if (changes.length === 0) {
        return (
            <div className="text-fifth">
                No changes from original setlist.
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {changes.map((change, index) => {
                const { icon } = getChangeIcon(change.change_type);

                return (
                    <div
                        key={change.show_change_uuid}
                        className={`flex items-center gap-2 ${index !== 0 ? 'pt-1 border-t border-[#d8d7d7]' : ''}`}
                    >
                        <div className="flex-shrink-0">
                            {icon}
                        </div>
                        <div className="text-fifth font-light [&_a]:font-medium text-xs">
                            {renderChangeText(change.change)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
