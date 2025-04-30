import React from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  anchor: HTMLElement | null;
}

export function Popup({ title, onClose, children, anchor }: Props) {
  const popupRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!anchor) return null;

  const rect = anchor.getBoundingClientRect();
  const left = rect.left;
  const top = rect.bottom + 8;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-primary border border-white/10 rounded-lg shadow-xl"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-sm font-medium text-white/90">{title}</h3>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white/90 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}