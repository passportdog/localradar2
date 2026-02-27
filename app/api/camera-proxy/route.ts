import { NextRequest, NextResponse } from 'next/server';

// Allowed camera domains for security
const ALLOWED_DOMAINS = [
  'fdotmiamidad.com',
  'florida.com',
  'fl511.com',
  'floridasturnpike.com',
  'miami.gov',
  'picsum.photos',
];

// Validate URL is from allowed domains
function isValidCameraUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraUrl = searchParams.get('url');

    if (!cameraUrl) {
      return NextResponse.json(
        { error: 'Missing camera URL' },
        { status: 400 }
      );
    }

    // Validate the camera URL
    if (!isValidCameraUrl(cameraUrl)) {
      return NextResponse.json(
        { error: 'Invalid camera domain' },
        { status: 403 }
      );
    }

    // Fetch the camera image
    const response = await fetch(cameraUrl, {
      headers: {
        'User-Agent': 'LocalRadar2/1.0 (Traffic Camera Proxy)',
        'Accept': 'image/*',
        'Referer': 'https://www.fdotmiamidad.com/',
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Camera unavailable: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the proxied image with security headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=10',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  } catch (error) {
    console.error('Camera proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy camera feed' },
      { status: 500 }
    );
  }
}

// POST method for fetching multiple cameras
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body as { urls: string[] };

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid URLs array' },
        { status: 400 }
      );
    }

    // Limit concurrent requests
    const limitedUrls = urls.slice(0, 10);

    const results = await Promise.allSettled(
      limitedUrls.map(async (url) => {
        if (!isValidCameraUrl(url)) {
          return { url, error: 'Invalid domain', status: 'error' };
        }

        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'LocalRadar2/1.0',
              'Accept': 'image/*',
              'Referer': 'https://www.fdotmiamidad.com/',
            },
          });

          if (!response.ok) {
            return { url, error: `HTTP ${response.status}`, status: 'error' };
          }

          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = response.headers.get('content-type') || 'image/jpeg';

          return {
            url,
            data: `data:${contentType};base64,${base64}`,
            status: 'success',
          };
        } catch (error) {
          return {
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'error',
          };
        }
      })
    );

    return NextResponse.json({
      results: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: 'Failed' })),
    });
  } catch (error) {
    console.error('Batch proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy camera feeds' },
      { status: 500 }
    );
  }
}
