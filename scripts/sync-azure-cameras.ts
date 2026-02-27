import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AZURE_MAPS_KEY = process.env.AZURE_MAPS_KEY;
const AZURE_BASE_URL = 'https://atlas.microsoft.com/traffic/camera/json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AzureCamera {
  id: string;
  type: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cameraName?: string;
    imageUrl?: string;
    videoUrl?: string;
    direction?: string;
    roadName?: string;
  };
}

// Florida regions to scan for cameras
const FLORIDA_REGIONS = [
  { lat: 25.7617, lng: -80.1918, name: 'Miami' },
  { lat: 26.1224, lng: -80.1373, name: 'Fort Lauderdale' },
  { lat: 27.9506, lng: -82.4572, name: 'Tampa' },
  { lat: 28.5383, lng: -81.3792, name: 'Orlando' },
  { lat: 30.3322, lng: -81.6557, name: 'Jacksonville' },
  { lat: 27.7676, lng: -82.6403, name: 'St Petersburg' },
  { lat: 26.7153, lng: -80.0534, name: 'West Palm Beach' },
  { lat: 28.0836, lng: -80.6081, name: 'Melbourne' },
  { lat: 27.2730, lng: -80.3582, name: 'Port St Lucie' },
  { lat: 26.5629, lng: -81.9495, name: 'Cape Coral' },
  { lat: 27.4989, lng: -82.5748, name: 'Bradenton' },
  { lat: 28.9020, lng: -81.2176, name: 'Deltona' },
];

async function fetchAzureCameras(lat: number, lng: number, radius: number = 50): Promise<AzureCamera[]> {
  const url = new URL(AZURE_BASE_URL);
  url.searchParams.set('subscription-key', AZURE_MAPS_KEY!);
  url.searchParams.set('api-version', '1.0');
  url.searchParams.set('query', `${lat},${lng}`);
  url.searchParams.set('radius', radius.toString());

  const response = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.cameras || [];
}

async function syncCameras() {
  console.log('🔄 Starting Azure Maps camera sync...\n');

  if (!AZURE_MAPS_KEY) {
    console.error('❌ AZURE_MAPS_KEY not set in .env.local');
    process.exit(1);
  }

  const results = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    errors: [] as string[],
    regions: FLORIDA_REGIONS.length,
  };

  // Collect all unique cameras from all regions
  const cameraMap = new Map<string, AzureCamera>();

  for (const region of FLORIDA_REGIONS) {
    try {
      console.log(`📍 Scanning ${region.name}...`);
      const cameras = await fetchAzureCameras(region.lat, region.lng, 50);
      
      for (const cam of cameras) {
        cameraMap.set(cam.id, cam);
      }
      
      console.log(`  ✓ Found ${cameras.length} cameras`);
      results.fetched += cameras.length;
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      const errorMsg = `Region ${region.name}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(`  ✗ ${errorMsg}`);
      results.errors.push(errorMsg);
    }
  }

  console.log(`\n📊 Total unique cameras found: ${cameraMap.size}`);
  console.log('⬆️  Upserting to database...\n');

  // Upsert all unique cameras to database
  for (const [id, cam] of cameraMap) {
    try {
      const cameraData = {
        camera_id: cam.id,
        name: cam.properties.cameraName || `Camera ${cam.id}`,
        intersection: cam.properties.roadName || null,
        lat: cam.geometry.coordinates[1],
        lng: cam.geometry.coordinates[0],
        stream_url: cam.properties.videoUrl || null,
        snapshot_url: cam.properties.imageUrl || null,
        state: 'FL',
        status: 'active',
        last_checked: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('traffic_cameras')
        .upsert(cameraData, { onConflict: 'camera_id' });

      if (error) {
        results.errors.push(`Camera ${id}: ${error.message}`);
      } else {
        results.updated++;
      }
    } catch (err) {
      results.errors.push(`Camera ${id}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  // Print summary
  console.log('✅ Sync complete!\n');
  console.log('📈 Summary:');
  console.log(`  Regions scanned: ${results.regions}`);
  console.log(`  Total cameras fetched: ${results.fetched}`);
  console.log(`  Unique cameras: ${cameraMap.size}`);
  console.log(`  Upserted to DB: ${results.updated}`);
  console.log(`  Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors (first 5):');
    results.errors.slice(0, 5).forEach(e => console.log(`  - ${e}`));
  }

  console.log('\n🦀 Done! Your cameras are now synced from Azure Maps.');
}

// Run sync
syncCameras().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
