'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Radio, AlertCircle } from 'lucide-react';
import { Camera } from '@/types/intel';

interface CameraPanelProps {
  camera: Camera | null;
  nearbyCameras: Camera[];
  onClose: () => void;
  onSelectNearby: (camera: Camera) => void;
}

export function CameraPanel({ camera, nearbyCameras, onClose, onSelectNearby }: CameraPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (camera) {
      setIsOpen(true);
      setIsLoading(true);
      
      // Build proxy URL for the still image (3-5s refresh)
      const proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(camera.snapshot_url || camera.stream_url || '')}`;
      setStreamUrl(proxyUrl);
      
      // Simulate loading
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      setStreamUrl(null);
    }
  }, [camera]);
  
  // Auto-refresh still image
  useEffect(() => {
    if (!streamUrl || !isOpen) return;
    
    const interval = setInterval(() => {
      if (camera?.snapshot_url) {
        setStreamUrl(`/api/camera-proxy?url=${encodeURIComponent(camera.snapshot_url)}&t=${Date.now()}`);
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [streamUrl, isOpen, camera]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'degraded': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'degraded': return 'DEGRADED';
      case 'inactive': return 'OFFLINE';
      default: return 'UNKNOWN';
    }
  };

  if (!camera) return null;

  return (
    <div
      className={`absolute top-0 right-0 h-full w-full md:w-[480px] bg-intel-panel border-l border-white/10 transform transition-transform duration-300 z-20 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)} animate-pulse`} />
          <div>
            <h2 className="font-semibold text-white">{camera.name}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(camera.status)}/20 text-${getStatusColor(camera.status).replace('bg-', '')}`}>
              {getStatusLabel(camera.status)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Stream View */}
      <div className="p-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-intel-cyan/30 border-t-intel-cyan rounded-full animate-spin" />
            </div>
          ) : streamUrl ? (
            <img
              src={streamUrl}
              alt={camera.name}
              className="w-full h-full object-cover"
              onError={() => setStreamUrl(null)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>Stream unavailable</p>
            </div>
          )}
          
          {/* Live indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/60 rounded text-xs">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-white">LIVE</span>
          </div>
          
          {/* Refresh indicator */}
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-gray-400">
            Auto-refresh: 3.5s
          </div>
        </div>
      </div>
      
      {/* Camera Info */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {camera.intersection && (
            <div className="flex items-center gap-2 text-gray-400 col-span-2">
              <MapPin className="w-4 h-4" />
              <span>{camera.intersection}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs uppercase">{camera.state}</span>
          </div>
        </div>
      </div>
      
      {/* Nearby Cameras */}
      {nearbyCameras.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Nearby Cameras</h3>
          <div className="grid grid-cols-2 gap-2">
            {nearbyCameras.slice(0, 4).map((nearby) => (
              <button
                key={nearby.id}
                onClick={() => onSelectNearby(nearby)}
                className="text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(nearby.status)}`} />
                  <span className="text-xs font-medium truncate">{nearby.name}</span>
                </div>
                <span className="text-xs text-gray-500">{nearby.intersection || ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
