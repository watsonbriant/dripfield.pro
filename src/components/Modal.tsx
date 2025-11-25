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
        className="fixed md:absolute inset-x-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 top-[72px] bottom-4 md:top-20 md:bottom-auto md:w-full z-50 bg-primary border border-fourth shadow-xl flex flex-col"
        style={{ maxWidth: maxWidth }}
      >
        <div className="flex items-center justify-between p-1 border-b border-fourth bg-tertiary">
          <h2 className="text-sm font-medium text-fifth inline-block pl-1">{title}</h2>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-white border border-fourth bg-red-500 transition-colors"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {children}
        </div>
      </div>
    </>
  );
}