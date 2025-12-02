import React from 'react';
import { SetlistEntry, Show } from '../../types/setlist';

interface CallbacksProps {
  show: Show;
}

export const Callbacks: React.FC<CallbacksProps> = ({ show }) => {
  if (!show.show_callbacks) return null;

  return (
    <div className="bg-fourth border border-fourth px-1.5 py-1 text-xs w-fit max-w-[800px] shadow-xl">
      <div 
        className="font-light text-white text-[0.625rem] leading-[0.75rem] hover:[&_a]:underline [&_a]:font-medium [&_a]:text-emerald-400"
        dangerouslySetInnerHTML={{ __html: show.show_callbacks }}
      />
    </div>
  );
};
