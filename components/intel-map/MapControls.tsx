'use client';

import { Crosshair, Plus, Minus } from 'lucide-react';

interface MapControlsProps {
  onLocate: () => void;
}

export function MapControls({ onLocate }: MapControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onLocate}
        className="w-10 h-10 flex items-center justify-center bg-intel-panel/90 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
        title="Locate me"
      >
        <Crosshair className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
