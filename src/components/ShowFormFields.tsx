import React from 'react';
import { ShowData, GroupData, TourData, SubvenueData, YearData } from '../types/showTypes';
import { convertToEasternDisplay } from '../utils/showUtils';
import { CallbacksEditor } from './CallbacksEditor';

interface ShowFormFieldsProps {
    editedShow: ShowData | null;
    isEditing: boolean;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    groups: GroupData[];
    tours: TourData[];
    subvenues: SubvenueData[];
    years: YearData[];
    selectedShow: ShowData;
    allShows: ShowData[];
    songs: any[];
}

export const ShowFormFields: React.FC<ShowFormFieldsProps> = ({
    editedShow,
    isEditing,
    onInputChange,
    groups,
    tours,
    subvenues,
    years,
    selectedShow,
    allShows,
    songs
}) => {
    return (
        <div className="px-2 pb-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Date</label>
                    <input
                        type="date"
                        name="show_date"
                        value={editedShow?.show_date || ''}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Group</label>
                    {isEditing ? (
                        <select
                            name="show_group"
                            value={editedShow?.show_group || ''}
                            onChange={onInputChange}
                            className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                        >
                            <option value="">-- Select Group --</option>
                            {groups.map((group) => (
                                <option key={group.group} value={group.group}>
                                    {group.group}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={editedShow?.show_group || ''}
                            readOnly
                            className="w-full px-2 py-0.5 border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Tour</label>
                    {isEditing ? (
                        <select
                            name="show_tour"
                            value={editedShow?.show_tour || ''}
                            onChange={onInputChange}
                            className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                        >
                            <option value="">-- Select Tour --</option>
                            {tours.map((tour) => (
                                <option key={tour.tour} value={tour.tour}>
                                    {tour.tour}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={editedShow?.show_tour || ''}
                            readOnly
                            className="w-full px-2 py-0.5 border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Subvenue</label>
                    {isEditing ? (
                        <select
                            name="show_subvenue"
                            value={editedShow?.show_subvenue || ''}
                            onChange={onInputChange}
                            className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                        >
                            <option value="">-- Select Subvenue --</option>
                            {subvenues.map((subvenue) => (
                                <option key={subvenue.subvenue} value={subvenue.subvenue}>
                                    {subvenue.subvenue} {subvenue.subvenue_venue_location && `- ${subvenue.subvenue_venue_location}`}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={editedShow?.show_subvenue || ''}
                            readOnly
                            className="w-full px-2 py-0.5 border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Year</label>
                    {isEditing ? (
                        <select
                            name="show_year"
                            value={editedShow?.show_year || ''}
                            onChange={onInputChange}
                            className="w-full px-2 py-0.5 font-light border border-fourth bg-canvas text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs"
                        >
                            <option value="">-- Select Year --</option>
                            {years.map((year) => (
                                <option key={year.year} value={year.year}>
                                    {year.year}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={editedShow?.show_year || ''}
                            readOnly
                            className="w-full px-2 py-0.5 border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Canon ID</label>
                    <input
                        type="text"
                        value={editedShow?.show_canonid || ''}
                        readOnly
                        className="w-full px-2 py-0.5 border border-fourth bg-canvas/50 text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary font-light text-xs"
                    />
                    <p className="text-xs text-fifth/60 italic mt-0.5">Auto-generated value</p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Detail</label>
                    <input
                        type="text"
                        name="show_detail"
                        value={editedShow?.show_detail || ''}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Alert</label>
                    <input
                        type="text"
                        name="show_alert"
                        value={editedShow?.show_alert || ''}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5 flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="show_iscanon"
                            checked={editedShow?.show_iscanon || false}
                            onChange={onInputChange}
                            disabled={!isEditing}
                            className="rounded border-fourth focus:ring-tertiary"
                        />
                        Is Canon?
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5 flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="show_issetlistgame"
                            checked={editedShow?.show_issetlistgame || false}
                            onChange={onInputChange}
                            disabled={!isEditing}
                            className="rounded border-fourth focus:ring-tertiary"
                        />
                        Is Setlist Game?
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">Show Time (Eastern Time)</label>
                    <input
                        type="datetime-local"
                        name="show_time"
                        value={convertToEasternDisplay(editedShow?.show_time || null)}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-fifth mb-0.5">WysteriaLane.org Thread Link</label>
                    <input
                        type="url"
                        name="show_wl_link"
                        value={editedShow?.show_wl_link || ''}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        placeholder="https://wysterialane.org/..."
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-fifth mb-0.5">Coach's Notes</label>
                    <textarea
                        name="show_coachnotes"
                        value={editedShow?.show_coachnotes || ''}
                        onChange={onInputChange}
                        readOnly={!isEditing}
                        rows={3}
                        className={`w-full px-2 py-0.5 font-light border ${isEditing ? 'border-fourth bg-canvas' : 'border-fourth bg-canvas/50'} text-fifth focus:outline-none focus:ring-2 focus:ring-tertiary text-xs`}
                    />
                </div>

                {/* Callbacks field */}
                <CallbacksEditor
                    selectedShow={selectedShow}
                    editedShow={editedShow}
                    isEditing={isEditing}
                    onInputChange={onInputChange}
                    allShows={allShows}
                    songs={songs}
                />
            </div>
        </div>
    );
};
