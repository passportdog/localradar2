'use client';

import { Video, Layers, Mountain, Building2 } from 'lucide-react';

interface LayerToggleProps {
  layers: {
    cameras: boolean;
    traffic: boolean;
    terrain: boolean;
    buildings3d: boolean;
  };
  onChange: (layers: LayerToggleProps['layers']) => void;
}

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
  const toggle = (key: keyof typeof layers) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <div className="flex flex-col gap-2 bg-intel-panel/90 backdrop-blur-sm rounded-lg p-2 border border-white/10">
      <ToggleButton
        active={layers.cameras}
        onClick={() => toggle('cameras')}
        icon={<Video className="w-4 h-4" />}
        label="Cameras"
      />
      <ToggleButton
        active={layers.terrain}
        onClick={() => toggle('terrain')}
        icon={<Mountain className="w-4 h-4" />}
        label="Terrain"
      />
      <ToggleButton
        active={layers.buildings3d}
        onClick={() => toggle('buildings3d')}
        icon={<Building2 className="w-4 h-4" />}
        label="3D Buildings"
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
        active
          ? 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30'
          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
