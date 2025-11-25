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
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] z-50 bg-primary rounded-lg border border-fourth shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-1 border-b border-fourth">
          <h2 className="text-sm font-semibold bg-tertiary text-fifth inline-block px-1.5 py-0.5 rounded-lg border border-fourth">{title}</h2>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-white rounded-lg border border-fourth bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-fifth" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {children}
        </div>
      </div>
    </>
  );
}