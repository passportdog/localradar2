# LocalRadar2 - Deployment Guide

## Prerequisites

- Node.js 20+
- Supabase account
- Mapbox account
- Vercel account

## Environment Setup

1. **Copy environment variables:**
```bash
cp .env.local.example .env.local
```

2. **Fill in your credentials:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your.mapbox.token
```

## Database Setup

1. **Install Supabase CLI:**
```bash
npm install -g supabase
```

2. **Link your project:**
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. **Run migrations:**
```bash
supabase migration up
```

4. **Seed camera data:**
```bash
npm run db:seed
```

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Vercel Deployment

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Add environment variables in Vercel dashboard:**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

## Features

### Deluxe Map Intelligence
- 3D Mapbox GL visualization with satellite base
- Real-time traffic camera network (FDOT/FL511)
- GeoJSON clustering for performance
- 3-5 second auto-refresh on camera feeds
- Secure streaming proxy with domain allowlisting

### API Endpoints
- `GET /api/cameras?lat=&lng=&radius=` - Fetch cameras by location
- `POST /api/cameras/refresh` - Refresh from FDOT feeds
- `GET /api/camera-proxy?url=` - Secure camera stream proxy

### Database
- PostGIS spatial queries
- Radius search with `get_cameras_within_radius()`
- ZIP code search with `get_cameras_by_zip()`
- RLS policies for security

## Architecture

```
app/
  explore/           # Main map route
  api/cameras/       # Camera API
  api/camera-proxy/  # Secure proxy
components/
  intel-map/         # Map components
    IntelMap.tsx     # Main map
    CameraLayer.tsx  # GeoJSON layer
    CameraPanel.tsx  # Camera viewer
    LayerToggle.tsx  # UI toggles
lib/
  intel-map/         # Map utilities
  supabase/          # DB clients
types/
  intel.ts           # TypeScript types
supabase/
  migrations/        # DB schema
scripts/
  seed-fdot-cameras.ts
```

## Security Notes

- Camera proxy validates domain allowlist
- Private IPs blocked (10.x, 192.168.x, etc.)
- RLS restricts camera data to active status
- Service role only for admin operations

## Post-Deploy Checklist

- [ ] Test `/explore` loads correctly
- [ ] Verify camera markers appear
- [ ] Click camera to test panel opens
- [ ] Check auto-refresh working (3.5s)
- [ ] Test layer toggles (terrain, 3D buildings)
- [ ] Verify search functionality
- [ ] Test geolocation button
- [ ] Confirm mobile responsiveness

## Troubleshooting

**Map not loading:**
- Check Mapbox token is valid
- Verify token has correct URL restrictions

**No cameras showing:**
- Run `npm run db:seed`
- Check Supabase RLS policies

**Camera proxy errors:**
- Verify camera URLs in database
- Check domain allowlist includes your camera source
