import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, fetchImage } = body;

    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // IMAGE FETCH MODE — fetch image and return as base64
    if (fetchImage) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return NextResponse.json({ success: false, error: `HTTP ${response.status}` });

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const mediaType = contentType.split(';')[0].trim();

        // Only process actual images
        if (!mediaType.startsWith('image/')) {
          return NextResponse.json({ success: false, error: 'Not an image' });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Limit to 5MB to avoid token overload
        if (base64.length > 6_000_000) {
          return NextResponse.json({ success: false, error: 'Image too large' });
        }

        return NextResponse.json({ success: true, base64, mediaType });

      } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
      }
    }

    // PAGE SCRAPE MODE — scrape HTML page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `HTTP ${response.status}` });
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescription = ogDescMatch?.[1] || metaDescMatch?.[1] || '';

    // Extract images — look for large property photos
    const images = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = imgMatch[1];
      if (
        src &&
        !src.startsWith('data:') &&
        !src.includes('icon') &&
        !src.includes('logo') &&
        !src.includes('avatar') &&
        !src.includes('thumbnail') &&
        !src.includes('placeholder') &&
        (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp'))
      ) {
        const absoluteUrl = src.startsWith('http') ? src : new URL(src, url).href;
        if (!images.includes(absoluteUrl)) images.push(absoluteUrl);
        if (images.length >= 40) break;
      }
    }

    // Also check og:image and og:image array
    const ogImages = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)];
    ogImages.forEach(m => {
      if (m[1] && !images.includes(m[1])) images.unshift(m[1]);
    });

    // Clean text content
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000);

    return NextResponse.json({
      success: true,
      title,
      metaDescription,
      text,
      images: images.slice(0, 40),
      url
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
