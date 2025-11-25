import React from 'react';
import { TourDropdown } from './TourDropdown';
import { ShowsDropdown } from './ShowsDropdown';
import ToggleSwitch from '../ToggleSwitch';

interface Tour {
  tour: string;
  tour_canonid: number;
  tour_id: string;
}

interface ShowDate {
  show_id: string;
  show_date: string;
  formatted_show_date: string;
  show_group: string;
  show_subvenue: string;
  show_venue_location: string | null;
  show_detail: string | null;
  show_alert: string | null;
  show_rarity_percentage: string | null;
  total_entry_length: string | null;
  show_canonid: number | null;
}

interface SetlistHeaderProps {
  tours: Tour[];
  showDates: ShowDate[];
  currentShowId?: string;
  currentTour?: string;
  onTourSelect: (tourId: string) => void;
  onShowSelect: (showId: string) => void;
  hasCoachNotes: boolean;
  showCoachNotes: boolean;
  onToggleCoachNotes: (checked: boolean) => void;
}

export const SetlistHeader: React.FC<SetlistHeaderProps> = ({
  tours,
  showDates,
  currentShowId,
  currentTour,
  onTourSelect,
  onShowSelect,
  hasCoachNotes,
  showCoachNotes,
  onToggleCoachNotes
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-fourth">
        Setlist
      </h1>
      <div className="flex items-center gap-4">
        {hasCoachNotes && (
          <ToggleSwitch
            checked={showCoachNotes}
            onChange={onToggleCoachNotes}
          />
        )}
        <ShowsDropdown
          showDates={showDates}
          currentShowId={currentShowId}
          onShowSelect={onShowSelect}
        />
        <TourDropdown
          tours={tours}
          currentTour={currentTour}
          onTourSelect={onTourSelect}
        />
      </div>
    </div>
  );
};
