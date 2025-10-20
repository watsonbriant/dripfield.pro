import React from 'react';
import { Modal } from './Modal';

interface SongSpreadItem {
  category: string;
  count: number;
  canonid: number;
  artwork: string | null;
  songs: {
    song: string;
    playCount: number;
    artist?: string;
  }[];
}

interface SongSpreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  songSpreadData: SongSpreadItem[];
}

export const SongSpreadModal: React.FC<SongSpreadModalProps> = ({
  isOpen,
  onClose,
  songSpreadData
}) => {
  // Calculate max count for song spread bars
  const maxCount = Math.max(...songSpreadData.map(cat => cat.count), 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Song Spread"
    >
      <div className="bg-primary">
        <div className="space-y-1.5">
          {songSpreadData.map(({ category, count, songs, artwork }) => (
            <div key={category}>
              <div className="text-fifth text-sm font-medium">
                {category}
              </div>
              <div className="h-5 rounded overflow-hidden">
                <div 
                  className="h-full bg-secondary rounded border border-secondary relative flex items-center"
                  style={{ 
                    width: `${(count / maxCount) * 100}%`,
                    minWidth: '48px'
                  }}
                >
                  {artwork && (
                    <img 
                      src={artwork} 
                      alt=""
                      onError={(e) => {
                        console.error(`Failed to load image for ${category}:`, artwork);
                        e.currentTarget.style.display = 'none';
                      }}
                      className="h-4 w-4 ml-0.5 object-cover rounded-sm"
                    />
                  )}
                  <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                    <span className="text-fifth text-sm font-semibold">{count}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
