'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface SearchBarProps {
  onSelect: (location: SearchResult) => void;
}

// Florida major cities for quick search
const FLORIDA_CITIES: SearchResult[] = [
  { id: 'miami', name: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { id: 'tampa', name: 'Tampa, FL', lat: 27.9506, lng: -82.4572 },
  { id: 'orlando', name: 'Orlando, FL', lat: 28.5383, lng: -81.3792 },
  { id: 'jacksonville', name: 'Jacksonville, FL', lat: 30.3322, lng: -81.6557 },
  { id: 'tallahassee', name: 'Tallahassee, FL', lat: 30.4383, lng: -84.2807 },
  { id: 'ftlauderdale', name: 'Fort Lauderdale, FL', lat: 26.1224, lng: -80.1373 },
  { id: 'stpetersburg', name: 'St. Petersburg, FL', lat: 27.7676, lng: -82.6403 },
  { id: 'hialeah', name: 'Hialeah, FL', lat: 25.8576, lng: -80.2781 },
  { id: 'portstlucie', name: 'Port St. Lucie, FL', lat: 27.2730, lng: -80.3582 },
  { id: 'cape coral', name: 'Cape Coral, FL', lat: 26.5629, lng: -81.9495 },
];

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Filter cities as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults(FLORIDA_CITIES);
      return;
    }
    
    const filtered = FLORIDA_CITIES.filter(city =>
      city.name.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query]);
  
  const handleSelect = useCallback((result: SearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setIsOpen(false);
  }, [onSelect]);
  
  const handleFocus = () => {
    setIsOpen(true);
    if (!query) {
      setResults(FLORIDA_CITIES);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search Florida cities..."
          className="w-full pl-10 pr-4 py-3 bg-intel-panel/90 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-intel-cyan/50"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-intel-panel border border-white/10 rounded-lg overflow-hidden shadow-xl max-h-80 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b border-white/5">
                Florida Cities
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-intel-cyan" />
                  <span className="text-white">{result.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
