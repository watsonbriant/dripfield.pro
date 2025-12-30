import { ShowChange } from '../types/showChanges';
import { getChangeIcon, renderChangeText } from '../utils/showChangesHelpers';

interface ChangesListProps {
    changes: ShowChange[];
}

export default function ChangesList({ changes }: ChangesListProps) {
    if (changes.length === 0) {
        return (
            <div className="text-fifth font-light text-[0.625rem]">
                No changes from original setlist.
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            {changes.map((change, index) => {
                const { icon } = getChangeIcon(change.change_type);

                return (
                    <div
                        key={change.show_change_uuid}
                        className={`flex items-center gap-2 hover:bg-tertiary/20 transition-colors ${index !== 0 ? '' : ''}`}
                    >
                        <div className="flex-shrink-0">
                            {icon}
                        </div>
                        <div className="text-fifth font-light [&_a]:font-medium text-[0.625rem] leading-[0.625rem]">
                            {renderChangeText(change.change)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
