'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Map, Loader2 } from 'lucide-react';

// Dynamic import for the map component (client-side only)
const IntelMap = dynamic(() => import('@/components/intel-map/IntelMap'), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  return (
    <div className="flex items-center justify-center h-screen bg-map-bg">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-intel-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Initializing Map Intelligence...</p>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-map-bg">
      <Suspense fallback={<MapLoading />}>
        <IntelMap />
      </Suspense>
    </main>
  );
}
