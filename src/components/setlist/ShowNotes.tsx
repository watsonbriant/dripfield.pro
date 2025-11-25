import React from 'react';
import { Pen } from 'lucide-react';
import { Show } from '../../types/setlist';

interface ShowNotesProps {
  show: Show;
}

export const ShowNotes: React.FC<ShowNotesProps> = ({ show }) => {
  if (!show.show_coachnotes) return null;

  return (
    <div className="bg-tertiary/50 border border-fourth px-1.5 py-1 w-fit max-w-[800px]">
      <div 
        className="text-fifth font-light text-[0.625rem] leading-[0.75rem] hover:[&_a]:underline [&_a]:font-medium"
        dangerouslySetInnerHTML={{ __html: show.show_coachnotes }}
      />
    </div>
  );
};
