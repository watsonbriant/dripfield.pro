import React from 'react';
import { Pen } from 'lucide-react';
import { Show } from '../../types/setlist';

interface ShowNotesProps {
  show: Show;
}

export const ShowNotes: React.FC<ShowNotesProps> = ({ show }) => {
  if (!show.show_coachnotes) return null;

  return (
    <div className="bg-primary border border-secondary rounded-lg p-3">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[1rem] leading-[1.125rem] font-medium text-fifth">Show Notes</h2>
        <Pen className="text-fifth w-[1rem] h-[1rem]" />
      </div>
      <div 
        className="text-fifth font-light text-xs hover:[&_a]:underline [&_a]:font-medium"
        dangerouslySetInnerHTML={{ __html: show.show_coachnotes }}
      />
    </div>
  );
};
