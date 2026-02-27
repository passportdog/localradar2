# LocalRadar2 🦀

Real-time traffic camera network with 3D map visualization for Florida roads.

![LocalRadar2](https://img.shields.io/badge/LocalRadar-2.0-cyan)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-blue)

## Features

- 🗺️ **3D Map Visualization** - Satellite base with building extrusion, terrain, and atmosphere
- 📹 **Live Camera Feeds** - Real-time traffic cameras with 3-5 second refresh
- 🔒 **Secure Streaming** - Proxy-layer security with domain allowlisting
- 📍 **Smart Search** - Find cameras by location or ZIP code
- 🎯 **Geo Clustering** - Performance-optimized camera markers
- 🌐 **Shareable URLs** - Deep-link any map state

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Maps:** Mapbox GL JS
- **Database:** Supabase + PostGIS
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Quick Start

```bash
# Clone and install
git clone https://github.com/passportdog/localradar2.git
cd localradar2
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Setup database
supabase migration up
npm run db:seed

# Run dev server
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/cameras` | Fetch cameras by lat/lng/radius |
| `POST /api/cameras/refresh` | Refresh FDOT camera data |
| `GET /api/camera-proxy?url=` | Secure camera stream proxy |

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

```bash
vercel --prod
```

## License

MIT
