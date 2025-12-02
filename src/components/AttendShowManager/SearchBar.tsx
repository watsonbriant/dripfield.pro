import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative w-3/4 lg:w-auto">
      <input
        type="text"
        placeholder="Search shows..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8 pr-3 py-1.5 text-xs bg-canvas text-fifth border border-fourth rounded text-sm focus:outline-none focus:ring-1 focus:ring-tertiary w-full lg:w-48"
      />
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-fifth/50 w-4 h-4" />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-fifth/50 hover:text-fifth p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
