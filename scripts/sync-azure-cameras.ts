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
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cameraName?: string;
    imageUrl?: string;
    videoUrl?: string;
    roadName?: string;
    locationLabel?: string;
  };
}

// Florida bounding box scan points
const FLORIDA_SCAN_POINTS = [
  { lat: 24.8, lng: -87.4 },  // SW
  { lat: 24.8, lng: -84.0 },  // South central
  { lat: 24.8, lng: -80.2 },  // SE
  { lat: 27.0, lng: -87.4 },  // West central
  { lat: 27.0, lng: -84.0 },  // Central
  { lat: 27.0, lng: -80.2 },  // East central
  { lat: 30.8, lng: -87.4 },  // NW
  { lat: 30.8, lng: -84.0 },  // North central
  { lat: 30.8, lng: -80.2 },  // NE
];

async function fetchAzureCameras(lat: number, lng: number): Promise<AzureCamera[]> {
  const url = new URL(AZURE_BASE_URL);
  url.searchParams.set('subscription-key', AZURE_MAPS_KEY!);
  url.searchParams.set('api-version', '1.0');
  url.searchParams.set('query', `${lat},${lng}`);
  url.searchParams.set('radius', '100'); // 100km radius per scan

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

async function syncAzureCameras() {
  console.log('🔄 Starting Azure Maps camera sync for Florida...\n');

  if (!AZURE_MAPS_KEY) {
    console.error('❌ AZURE_MAPS_KEY not set in .env.local');
    process.exit(1);
  }

  // Collect all unique cameras from all scan points
  const cameraMap = new Map<string, AzureCamera>();

  for (const point of FLORIDA_SCAN_POINTS) {
    try {
      console.log(`📍 Scanning ${point.lat}, ${point.lng}...`);
      const cameras = await fetchAzureCameras(point.lat, point.lng);
      
      for (const cam of cameras) {
        cameraMap.set(cam.id, cam);
      }
      
      console.log(`  ✓ Found ${cameras.length} cameras (total unique: ${cameraMap.size})`);
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ Error at ${point.lat}, ${point.lng}:`, err);
    }
  }

  console.log(`\n📊 Total unique cameras from Azure: ${cameraMap.size}`);
  console.log('⬆️  Upserting to database...\n');

  let upserted = 0;

  // Upsert all unique cameras to database
  for (const [id, cam] of cameraMap) {
    try {
      const cameraData = {
        camera_id: `az-${cam.id}`,
        name: cam.properties.cameraName || `Camera ${cam.id}`,
        intersection: cam.properties.roadName || cam.properties.locationLabel || null,
        lat: cam.geometry.coordinates[1],
        lng: cam.geometry.coordinates[0],
        stream_url: cam.properties.videoUrl || null,
        snapshot_url: cam.properties.imageUrl || null,
        state: 'FL',
        status: 'active',
        last_checked: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('traffic_cameras')
        .upsert(cameraData, { onConflict: 'camera_id' });

      if (error) {
        console.error(`  ✗ Camera az-${id}: ${error.message}`);
      } else {
        upserted++;
      }
    } catch (err) {
      console.error(`  ✗ Camera az-${id}:`, err);
    }
  }

  console.log(`✅ Upserted ${upserted} real cameras`);

  // Delete placeholder cameras
  console.log('\n🗑️  Deleting placeholder cameras...');
  const { data: deleted, error: deleteError } = await supabase
    .from('traffic_cameras')
    .delete()
    .like('snapshot_url', '%picsum.photos%')
    .select('camera_id');

  if (deleteError) {
    console.error('  ✗ Error deleting placeholders:', deleteError.message);
  } else {
    console.log(`  ✅ Deleted ${deleted?.length || 0} placeholder cameras`);
  }

  // Final count
  const { count, error: countError } = await supabase
    .from('traffic_cameras')
    .select('*', { count: 'exact', head: true });

  console.log('\n📈 Final Results:');
  console.log(`  Real cameras upserted: ${upserted}`);
  console.log(`  Placeholders deleted: ${deleted?.length || 0}`);
  console.log(`  Total cameras in DB: ${count || 'unknown'}`);

  if (countError) {
    console.error('  Could not get final count:', countError.message);
  }

  console.log('\n🦀 Done! Your map now has real Florida traffic cameras from Azure Maps.');
}

// Run sync
syncAzureCameras().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
