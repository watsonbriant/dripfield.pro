import React from 'react';
import { SetlistEntry, Show } from '../../types/setlist';

interface CallbacksProps {
  show: Show;
}

export const Callbacks: React.FC<CallbacksProps> = ({ show }) => {
  if (!show.show_callbacks) return null;

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3 text-sm">
      <div 
        className="font-light text-fifth [&_a]:text-fifth [&_a]:border [&_a]:border-secondary [&_a]:bg-tertiary [&_a]:rounded-lg [&_a]:py-0.5 [&_a]:px-1 [&_a]:font-medium"
        dangerouslySetInnerHTML={{ __html: show.show_callbacks }}
      />
    </div>
  );
};
