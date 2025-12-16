import React from 'react';

interface WtedEpisodeStatsProps {
  artwork?: string | null;
}

export const WtedEpisodeStats: React.FC<WtedEpisodeStatsProps> = ({ artwork }) => {
  if (!artwork) return null;

  return (
    <div>
      {artwork && (
        <div className="flex justify-center mb-2">
          <img
            src={artwork}
            alt="Episode artwork"
            className="max-h-[60px]"
          />
        </div>
      )}
    </div>
  );
};

