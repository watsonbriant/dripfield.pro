import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '450px' }: ModalProps) {
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <div 
        className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] bottom-4 md:top-20 md:bottom-auto md:w-full z-50 bg-primary rounded-lg border border-secondary shadow-xl flex flex-col"
        style={{ maxWidth: maxWidth }}
      >
        <div className="flex items-center justify-between p-4 border-b border-secondary">
          <h2 className="text-xl font-medium bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tertiary rounded-lg border border-secondary bg-red-500 transition-colors"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}