import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAttendShowData } from '../hooks/useAttendShowData';
import { useYearsData } from '../hooks/useYearsData';
import { useTableSort, getFilteredAndSortedShows } from '../hooks/useTableSort';
import { SearchBar } from './AttendShowManager/SearchBar';
import { YearFilter } from './AttendShowManager/YearFilter';
import { ShowTable } from './AttendShowManager/ShowTable';

interface AttendShowManagerProps {
  onClose: () => void;
}

const AttendShowManager: React.FC<AttendShowManagerProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom hooks for data management
  const { years, yearFilter, setYearFilter } = useYearsData();
  const { shows, loading, handleAttendanceToggle } = useAttendShowData(yearFilter);
  const { sortColumn, sortDirection, handleSort, getSortIcon } = useTableSort();

  // Get filtered and sorted shows
  const filteredShows = getFilteredAndSortedShows(shows, searchQuery, sortColumn, sortDirection);

  return (
    <div className="bg-primary border border-fourth p-2 max-w-[1280px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-2">
        <div className="flex items-center gap-3 mb-2 lg:mb-0">
          <button
            onClick={onClose}
            className="p-0.5 text-fifth bg-tertiary hover:bg-tertiary/70 transition-colors border border-fourth rounded"
            aria-label="Back to attended shows"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-2 py-0.5 rounded border border-fourth">Manage Attended Shows</h2>
        </div>
        
        <div className="flex gap-3 mt-1 lg:mt-0 w-full lg:w-auto lg:justify-end">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <YearFilter years={years} yearFilter={yearFilter} setYearFilter={setYearFilter} />
        </div>
      </div>

      <div className="mb-3 text-fifth text-xs font-light">
        Check the boxes next to shows you've attended to add them to your list. Uncheck to remove them.
      </div>

      <ShowTable
        shows={filteredShows}
        loading={loading}
        searchQuery={searchQuery}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        getSortIcon={getSortIcon}
        onAttendanceToggle={handleAttendanceToggle}
      />
    </div>
  );
};

export default AttendShowManager;