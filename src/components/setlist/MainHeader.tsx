import React from 'react';
import { ShowDropdown } from './ShowDropdown';
import { ShowData } from '../../types/setlist';
import { getHeaderStyle, getHeaderText } from '../../utils/setlistUtils';

interface MainHeaderProps {
  saveStatus: 'idle' | 'processing' | 'done' | 'error';
  shows: ShowData[];
  loading: boolean;
  loadingProgress: number;
  onShowSelect: (show: ShowData) => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  saveStatus,
  shows,
  loading,
  loadingProgress,
  onShowSelect
}) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className={`text-sm font-semibold text-fifth inline-block px-2 py-0.5 transition-colors ${getHeaderStyle(saveStatus)}`}>
        {getHeaderText(saveStatus)}
      </h3>
      
      <ShowDropdown
        shows={shows}
        loading={loading}
        loadingProgress={loadingProgress}
        onShowSelect={onShowSelect}
      />
    </div>
  );
};
