import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, fetchImage } = body;

    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // IMAGE FETCH MODE
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
        if (!mediaType.startsWith('image/')) return NextResponse.json({ success: false, error: 'Not an image' });

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 4000000) return NextResponse.json({ success: false, error: 'Image too large' });

        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return NextResponse.json({ success: true, base64, mediaType });
      } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
      }
    }

    // PAGE SCRAPE MODE
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

    if (!response.ok) return NextResponse.json({ success: false, error: `HTTP ${response.status}` });

    const html = await response.text();

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = ogTitleMatch?.[1] || titleMatch?.[1] || '';

    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescription = ogDescMatch?.[1] || metaDescMatch?.[1] || '';

    const images = new Set();
    const baseUrl = new URL(url);

    const makeAbsolute = (src) => {
      if (!src) return null;
      try {
        if (src.startsWith('http')) return src;
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) return baseUrl.origin + src;
        return new URL(src, url).href;
      } catch { return null; }
    };

    const isPhoto = (src) => {
      if (!src) return false;
      if (src.startsWith('data:')) return false;
      const lower = src.toLowerCase();
      if (lower.includes('icon') || lower.includes('logo') || lower.includes('avatar') ||
          lower.includes('favicon') || lower.includes('sprite') || lower.includes('placeholder') ||
          lower.includes('thumb') || lower.includes('-small') || lower.includes('-tiny')) return false;
      return lower.match(/\.(jpg|jpeg|png|webp)(\?|$|#)/) !== null ||
             lower.includes('/photos/') || lower.includes('/images/') || lower.includes('/gallery/');
    };

    // Normalize URL for dedup - strip query strings
    const normalizeUrl = (src) => {
      try { return src.split('?')[0].split('#')[0]; } catch { return src; }
    };

    // Track normalized URLs for dedup
    const seenNormalized = new Set();
    const addImage = (src) => {
      if (!src || !isPhoto(src)) return;
      const norm = normalizeUrl(src);
      if (!seenNormalized.has(norm)) {
        seenNormalized.add(norm);
        images.add(src);
      }
    };

    // og:image
    const ogImgs = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi)];
    ogImgs.forEach(m => { const s = makeAbsolute(m[1]); addImage(s); });

    // img src
    const imgRx = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = imgRx.exec(html)) !== null) {
      addImage(makeAbsolute(m[1]));
      if (images.size >= 40) break;
    }

    // data-src (lazy load)
    const dsRx = /data-src=["']([^"']+)["']/gi;
    while ((m = dsRx.exec(html)) !== null) {
      addImage(makeAbsolute(m[1]));
      if (images.size >= 40) break;
    }

    // srcset - take largest image from each srcset
    const ssRx = /srcset=["']([^"']+)["']/gi;
    while ((m = ssRx.exec(html)) !== null) {
      const parts = m[1].split(',').map(p => p.trim().split(' ')[0]);
      // Take last URL (usually largest)
      const largest = makeAbsolute(parts[parts.length - 1]);
      addImage(largest);
      if (images.size >= 40) break;
    }

    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ').trim().substring(0, 4000);

    const imageArray = [...images].slice(0, 40);

    return NextResponse.json({ success: true, title, metaDescription, text, images: imageArray, url });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
