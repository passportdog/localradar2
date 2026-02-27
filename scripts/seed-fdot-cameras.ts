import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Florida major highway corridors with camera positions
const CORRIDORS = [
  { 
    name: 'I-4', 
    start: [27.95, -82.45], 
    end: [28.54, -81.38],
    cameras: [
      { mm: 1, loc: [27.96, -82.44], name: 'I-4 @ MM 1 Tampa' },
      { mm: 10, loc: [27.98, -82.35], name: 'I-4 @ MM 10 Plant City' },
      { mm: 25, loc: [28.05, -82.15], name: 'I-4 @ MM 25 Lakeland' },
      { mm: 48, loc: [28.18, -81.85], name: 'I-4 @ MM 48 Celebration' },
      { mm: 64, loc: [28.30, -81.65], name: 'I-4 @ MM 64 Orlando' },
      { mm: 78, loc: [28.42, -81.45], name: 'I-4 @ MM 78 Altamonte' },
      { mm: 90, loc: [28.50, -81.38], name: 'I-4 @ MM 90 Sanford' },
    ]
  },
  {
    name: 'I-75',
    start: [27.0, -82.5],
    end: [30.4, -82.3],
    cameras: [
      { mm: 5, loc: [27.10, -82.45], name: 'I-75 @ MM 5 Naples' },
      { mm: 80, loc: [27.50, -82.30], name: 'I-75 @ MM 80 Sarasota' },
      { mm: 160, loc: [27.95, -82.35], name: 'I-75 @ MM 160 Tampa' },
      { mm: 210, loc: [28.35, -82.30], name: 'I-75 @ MM 210 Ocala' },
      { mm: 280, loc: [29.00, -82.30], name: 'I-75 @ MM 280 Gainesville' },
      { mm: 340, loc: [29.50, -82.30], name: 'I-75 @ MM 340 Lake City' },
      { mm: 410, loc: [30.25, -82.30], name: 'I-75 @ MM 410 Jennings' },
    ]
  },
  {
    name: 'I-95',
    start: [25.8, -80.2],
    end: [30.7, -81.7],
    cameras: [
      { mm: 1, loc: [25.85, -80.25], name: 'I-95 @ MM 1 Miami' },
      { mm: 12, loc: [25.95, -80.20], name: 'I-95 @ MM 12 Miami Gardens' },
      { mm: 38, loc: [26.25, -80.15], name: 'I-95 @ MM 38 Boca Raton' },
      { mm: 62, loc: [26.70, -80.05], name: 'I-95 @ MM 62 West Palm' },
      { mm: 101, loc: [27.45, -80.35], name: 'I-95 @ MM 101 Ft Pierce' },
      { mm: 147, loc: [28.35, -80.75], name: 'I-95 @ MM 147 Melbourne' },
      { mm: 180, loc: [28.75, -81.25], name: 'I-95 @ MM 180 Titusville' },
      { mm: 205, loc: [29.20, -81.10], name: 'I-95 @ MM 205 Daytona' },
      { mm: 260, loc: [29.95, -81.35], name: 'I-95 @ MM 260 St Augustine' },
      { mm: 318, loc: [30.35, -81.55], name: 'I-95 @ MM 318 Jacksonville' },
    ]
  },
  {
    name: 'I-10',
    start: [30.4, -87.2],
    end: [30.3, -82.3],
    cameras: [
      { mm: 1, loc: [30.50, -87.30], name: 'I-10 @ MM 1 Pensacola' },
      { mm: 50, loc: [30.55, -86.80], name: 'I-10 @ MM 50 Crestview' },
      { mm: 100, loc: [30.55, -86.30], name: 'I-10 @ MM 100 Defuniak' },
      { mm: 130, loc: [30.45, -85.90], name: 'I-10 @ MM 130 Marianna' },
      { mm: 175, loc: [30.45, -85.40], name: 'I-10 @ MM 175 Chipley' },
      { mm: 203, loc: [30.45, -84.30], name: 'I-10 @ MM 203 Tallahassee' },
      { mm: 225, loc: [30.40, -83.95], name: 'I-10 @ MM 225 Monticello' },
      { mm: 260, loc: [30.30, -83.40], name: 'I-10 @ MM 260 Lake City' },
      { mm: 296, loc: [30.30, -82.85], name: 'I-10 @ MM 296 Sanderson' },
      { mm: 335, loc: [30.30, -82.30], name: 'I-10 @ MM 335 Jacksonville' },
    ]
  },
  {
    name: 'FL Turnpike',
    start: [25.9, -80.3],
    end: [29.7, -82.1],
    cameras: [
      { mm: 0, loc: [25.90, -80.30], name: 'Turnpike @ MM 0 Golden Glades' },
      { mm: 47, loc: [26.40, -80.20], name: 'Turnpike @ MM 47 West Palm' },
      { mm: 99, loc: [27.20, -80.30], name: 'Turnpike @ MM 99 Ft Pierce' },
      { mm: 152, loc: [27.85, -80.60], name: 'Turnpike @ MM 152 Yeehaw' },
      { mm: 193, loc: [28.30, -81.35], name: 'Turnpike @ MM 193 Kissimmee' },
      { mm: 254, loc: [28.80, -82.00], name: 'Turnpike @ MM 254 Wildwood' },
      { mm: 289, loc: [29.20, -82.15], name: 'Turnpike @ MM 289 Ocala' },
      { mm: 309, loc: [29.70, -82.10], name: 'Turnpike @ MM 309 I-75' },
    ]
  },
];

const DIRECTIONS = ['NB', 'SB', 'EB', 'WB'];

function generateStillUrl(corridor: string, mm: number): string {
  const slug = corridor.toLowerCase().replace(/\s/g, '-');
  return `https://fl511.com/cameras/${slug}-${mm}.jpg`;
}

async function seedCameras() {
  console.log('Seeding FDOT traffic cameras...\n');
  
  let totalCreated = 0;
  let totalErrors = 0;
  
  for (const corridor of CORRIDORS) {
    console.log(`Processing ${corridor.name}...`);
    
    for (const cam of corridor.cameras) {
      // Create 2 cameras per location (both directions)
      for (let i = 0; i < 2; i++) {
        const direction = DIRECTIONS[i % 2 + (corridor.name.includes('Turnpike') ? 0 : 2)];
        const cameraName = `${cam.name} ${direction}`;
        
        // Slight offset for second camera
        const latOffset = i === 1 ? 0.002 : 0;
        const lngOffset = i === 1 ? 0.002 : 0;
        
        const { error } = await supabase
          .from('traffic_cameras')
          .upsert({
            name: cameraName,
            latitude: cam.loc[0] + latOffset,
            longitude: cam.loc[1] + lngOffset,
            status: Math.random() > 0.9 ? 'degraded' : 'active', // 10% degraded
            direction,
            still_url: generateStillUrl(corridor.name, cam.mm),
            stream_url: null, // Would be HLS stream in production
            source: 'fdot',
            last_checked: new Date().toISOString(),
          }, {
            onConflict: 'name',
          });
          
        if (error) {
          console.error(`  ✗ ${cameraName}: ${error.message}`);
          totalErrors++;
        } else {
          totalCreated++;
        }
      }
    }
    
    console.log(`  Created ${corridor.cameras.length * 2} cameras for ${corridor.name}\n`);
  }
  
  console.log('\n✓ Seeding complete!');
  console.log(`  Total created: ${totalCreated}`);
  console.log(`  Errors: ${totalErrors}`);
  
  // Show sample count
  const { count } = await supabase
    .from('traffic_cameras')
    .select('*', { count: 'exact', head: true });
  console.log(`  Total in database: ${count}`);
}

seedCameras().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
