import React from 'react';
import { X } from 'lucide-react';

interface CompactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function CompactModal({ isOpen, onClose, title, children }: CompactModalProps) {
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] z-50 bg-primary rounded-lg border border-white/10 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h2 className="text-lg font-semibold bg-tertiary text-fifth inline-block px-3 py-1.5 rounded-lg border border-secondary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}