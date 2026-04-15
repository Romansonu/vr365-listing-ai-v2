'use client';
import { useState, useRef } from 'react';

const CHAR_LIMITS = {
  'Airbnb': 50, 'VRBO': 75, 'Booking.com': 60, 'TripAdvisor': 80,
  'Google Vacation Rentals': 100, 'Hipcamp': 60, 'Expedia': 120,
  'Hotels.com': 100, 'Agoda': 80, 'Kayak': 90,
  'Homes and Villas by Marriott': 100, 'Plum Guide': 60, 'Houfy': 75,
  'Vacasa': 80, 'Evolve': 75, 'Furnished Finder': 80,
  'Glamping Hub': 60, "Misterbnb": 75,
};

const OTA_META = {
  'Airbnb': { icon: '🏠', color: 'airbnb' },
  'VRBO': { icon: '🌴', color: 'vrbo' },
  'Booking.com': { icon: '🔵', color: 'booking' },
  'TripAdvisor': { icon: '🦉', color: 'tripadvisor' },
  'Google Vacation Rentals': { icon: '🔍', color: 'google' },
  'Hipcamp': { icon: '🏕️', color: 'hipcamp' },
  'Expedia': { icon: '🏨', color: 'expedia' },
  'Hotels.com': { icon: '🏩', color: 'hotelscom' },
  'Agoda': { icon: '🌐', color: 'agoda' },
  'Kayak': { icon: '🔎', color: 'kayak' },
  'Homes and Villas by Marriott': { icon: '🏅', color: 'marriott' },
  'Plum Guide': { icon: '✨', color: 'plumguide' },
  'Houfy': { icon: '🏡', color: 'houfy' },
  'Vacasa': { icon: '🏘️', color: 'vacasa' },
  'Evolve': { icon: '🔑', color: 'evolve' },
  'Furnished Finder': { icon: '🛋️', color: 'furnishedfinder' },
  'Glamping Hub': { icon: '⛺', color: 'glampinghub' },
  "Misterbnb": { icon: '🌈', color: 'misterbnb' },
};

const ALL_OTAS = Object.keys(CHAR_LIMITS);
const POPULAR_OTAS = ['Airbnb', 'VRBO', 'Booking.com', 'TripAdvisor'];

const FEATURES = [
  { id: 'ota', icon: '📰', name: 'OTA Headlines', desc: '10 variations per platform' },
  { id: 'otadesc', icon: '📝', name: 'OTA Descriptions', desc: 'Full body copy per platform' },
  { id: 'photos', icon: '📸', name: 'Photo Descriptions', desc: 'Room-by-room captions' },
  { id: 'pricing', icon: '💰', name: 'Pricing Intelligence', desc: 'Market rates + suggestions' },
  { id: 'rules', icon: '📋', name: 'House Rules + FAQ', desc: 'Auto-generated policies' },
  { id: 'seo', icon: '🔍', name: 'SEO + Keywords', desc: 'Keywords + meta tags' },
  { id: 'market', icon: '📊', name: 'Market Intel', desc: 'Competitor + seasonal rates' },
  { id: 'audit', icon: '🩺', name: 'Listing Auditor', desc: 'Health score + fix suggestions' },
];

async function callAI(messages, maxTokens = 4000) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'API error');
  const text = (data.content || []).map(b => b.text || '').join('').trim();

  // Try multiple JSON extraction strategies
  const tries = [
    () => JSON.parse(text),
    () => JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}')+1)),
    () => { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; },
    () => JSON.parse(text.replace(/,([\s]*[}\]])/g,'$1')),
  ];
  for (const fn of tries) {
    try { const r = fn(); if (r) return r; } catch {}
  }
  throw new Error('Could not parse AI response. Please try again or select fewer options.');
}

export default function ToolSection() {
  const [url, setUrl] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [selectedOTAs, setSelectedOTAs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('ota');
  const [auditUrl, setAuditUrl] = useState('');
  const [photoLimit, setPhotoLimit] = useState(10);
  const [inputMode, setInputMode] = useState('url');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false); // 'url' or 'manual'
  const [manualData, setManualData] = useState({
    title: '', address: '', type: '', bedrooms: '', bathrooms: '',
    guests: '', sqft: '', amenities: '', description: '', nearbyAttractions: ''
  });
  const [auditLoading, setAuditLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]); // {url, base64, name}
  const [auditResult, setAuditResult] = useState(null);
  const fileRef = useRef();

  const toggleFeature = (id) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleOTA = (name) => {
    setSelectedOTAs(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const analyze = async () => {
    if (inputMode === 'url' && !url) return setError('Please paste a property URL.');
    if (inputMode === 'manual' && !manualData.title && !manualData.address && uploadedPhotos.length === 0) return setError('Please enter property details or upload photos.');
    if (selectedFeatures.size === 0) return setError('Please select at least one feature.');
    if (selectedFeatures.has('ota') && selectedOTAs.size === 0) return setError('Please select at least one OTA platform.');

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // STEP 1: Scrape or use manual data
      let scrapedContext = '';
      let scrapedImages = [];

      if (inputMode === 'manual') {
        // Build context from manual entry - no URL needed
        scrapedContext = 'PROPERTY DATA ENTERED BY USER:\nName: ' + (manualData.title || 'Vacation Rental') + '\nLocation: ' + (manualData.address || 'Location not specified') + '\nType: ' + (manualData.type || 'Vacation Rental') + '\nBedrooms: ' + (manualData.bedrooms || '?') + ', Bathrooms: ' + (manualData.bathrooms || '?') + ', Guests: ' + (manualData.guests || '?') + '\nAmenities: ' + (manualData.amenities || '') + '\nNearby: ' + (manualData.nearbyAttractions || '') + '\nDescription: ' + (manualData.description || '') + '\nUSE ONLY THIS DATA. Do not make up details.';
        setLoadingStep('📝 Using manual property data...');
      } else {
        setLoadingStep('🔍 Scanning website...');
        try {
          const scrapeRes = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const scraped = await scrapeRes.json();
          if (scraped.success && scraped.text) {
            const shortText = scraped.text.substring(0, 1500);
                        scrapedContext = 'REAL LISTING DATA:\nTitle: ' + scraped.title + '\nDescription: ' + scraped.metaDescription + '\nContent: ' + shortText + '\nUSE THIS REAL DATA ONLY.';
            scrapedImages = scraped.images || [];
            console.log('Scraped images count:', scrapedImages.length, scrapedImages.slice(0,3));
            setLoadingStep('🔍 Found ' + scrapedImages.length + ' images...');
          } else {
            console.log('Scrape failed or no text:', scraped);
          }
        } catch { /* scrape failed, continue */ }
      }

      // STEP 2: Get property info + non-OTA sections
      setLoadingStep('🏠 Analyzing property details...');
      const wantPhotos = selectedFeatures.has('photos');

      // Fetch real image data for vision analysis
      let photoBase64List = [];
      if (wantPhotos && scrapedImages.length > 0) {
        setLoadingStep('📸 Loading ' + scrapedImages.length + ' photos for analysis...');
        // Fetch images in parallel with concurrency limit
        const imagesToFetch = scrapedImages.slice(0, photoLimit);
        const photoFetches = imagesToFetch.map(async (imgUrl) => {
          try {
            const r = await fetch('/api/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imgUrl, fetchImage: true }),
            });
            if (!r.ok) return { url: imgUrl, base64: null };
            const d = await r.json();
            if (d.success && d.base64) return { url: imgUrl, base64: d.base64, mediaType: d.mediaType || 'image/jpeg' };
          } catch(e) {}
          return { url: imgUrl, base64: null };
        });
        photoBase64List = await Promise.all(photoFetches);
        const loaded = photoBase64List.filter(p => p.base64).length;
        setLoadingStep('📸 Loaded ' + loaded + ' of ' + imagesToFetch.length + ' photos...');
      }
      const wantPricing = selectedFeatures.has('pricing');
      const wantRules = selectedFeatures.has('rules');
      const wantSEO = selectedFeatures.has('seo');
      const wantMarket = selectedFeatures.has('market');
      const wantOTA = selectedFeatures.has('ota') || selectedFeatures.has('otadesc');

            const customInstructions = customPrompt ? '\n\nSPECIAL INSTRUCTIONS: ' + customPrompt : '';

      const mainPrompt = `You are a vacation rental copywriter. Extract real property info and generate content.
${scrapedContext}
URL: ${inputMode === 'manual' ? 'Manual entry' : url}${customInstructions}
Return ONLY valid JSON, no other text:
{
  "property": {
    "title": "property name",
    "address": "city, state",
    "type": "property type",
    "bedrooms": 3,
    "bathrooms": 2,
    "guests": 6,
    "sqft": 1800,
    "highlights": ["highlight1","highlight2","highlight3"],
    "nearbyAttractions": ["nearby1","nearby2","nearby3"]
  }
  ${wantPhotos && photoBase64List.filter(p => !p.base64).length === photoBase64List.length ? `,"photos": [
    {"room":"Living Room","emoji":"🛋️","description":"2-3 sentence description based on real listing"},
    {"room":"Master Bedroom","emoji":"🛏️","description":"description"},
    {"room":"Kitchen","emoji":"🍳","description":"description"},
    {"room":"Bathroom","emoji":"🚿","description":"description"},
    {"room":"Outdoor Space","emoji":"🌿","description":"description"},
    {"room":"View","emoji":"🌅","description":"description"}
  ]` : ''}
  ${wantPricing ? `,"pricing": {
    "platforms": [
      {"name":"Airbnb","low":0,"high":0,"avg":0,"occupancy":"0%"},
      {"name":"VRBO","low":0,"high":0,"avg":0,"occupancy":"0%"},
      {"name":"Booking.com","low":0,"high":0,"avg":0,"occupancy":"0%"},
      {"name":"Direct Book","low":0,"high":0,"avg":0,"occupancy":"0%"}
    ],
    "notes":"pricing strategy based on location",
    "seasonalTip":"seasonal advice",
    "weekendPremium":"15-20%"
  }` : ''}
  ${wantRules ? `,"rules": {
    "checkIn":"4:00 PM","checkOut":"11:00 AM",
    "items":[
      {"icon":"🚭","rule":"No smoking anywhere on the property"},
      {"icon":"🐾","rule":"Pet policy based on listing"},
      {"icon":"🎉","rule":"No parties without written approval"},
      {"icon":"🔇","rule":"Quiet hours 10 PM - 8 AM"},
      {"icon":"🔑","rule":"Self check-in via smart lock"},
      {"icon":"🧹","rule":"Basic cleaning required on checkout"},
      {"icon":"👥","rule":"Maximum occupancy strictly enforced"},
      {"icon":"🚗","rule":"Parking details from listing"}
    ],
    "faq":[
      {"q":"Is WiFi fast enough for remote work?","a":"based on listing details"},
      {"q":"Are there nearby grocery stores?","a":"based on location"},
      {"q":"What is included in the kitchen?","a":"based on listing"},
      {"q":"Is there a minimum stay?","a":"based on listing"},
      {"q":"Can I get early check-in?","a":"We accommodate when possible — message 48h ahead."},
      {"q":"Is the property accessible?","a":"based on listing"}
    ]
  }` : ''}
  ${wantSEO ? `,"seo": {
    "primaryKeywords":["kw1","kw2","kw3","kw4","kw5"],
    "longTailKeywords":["lt1","lt2","lt3","lt4"],
    "localKeywords":["loc1","loc2","loc3"],
    "titleTag":"SEO title under 60 chars",
    "metaDescription":"Meta description under 155 chars",
    "tips":["tip1","tip2","tip3"]
  }` : ''}
  ${wantMarket ? `,"market": {
    "yourRate":{"low":0,"high":0,"avg":0},
    "marketAvg":{"low":0,"high":0,"avg":0},
    "competitorRange":{"low":0,"high":0},
    "position":"market position analysis",
    "byBedroom":[
      {"bedrooms":1,"marketAvg":0,"suggested":0},
      {"bedrooms":2,"marketAvg":0,"suggested":0},
      {"bedrooms":3,"marketAvg":0,"suggested":0},
      {"bedrooms":4,"marketAvg":0,"suggested":0},
      {"bedrooms":5,"marketAvg":0,"suggested":0}
    ],
    "seasonal":[
      {"period":"Peak Summer (Jun-Aug)","multiplier":1.4,"suggestedRate":0,"notes":"peak demand"},
      {"period":"Spring Break (Mar-Apr)","multiplier":1.25,"suggestedRate":0,"notes":"family surge"},
      {"period":"Holiday Season (Nov-Dec)","multiplier":1.35,"suggestedRate":0,"notes":"premium rates"},
      {"period":"Shoulder Season","multiplier":0.9,"suggestedRate":0,"notes":"slight reduction"},
      {"period":"Low Season (Jan-Feb)","multiplier":0.7,"suggestedRate":0,"notes":"offer discounts"}
    ],
    "occasions":[
      {"occasion":"New Years Eve","premium":"2.5x","suggestedRate":0,"minStay":3,"tip":"book 2-3 months out"},
      {"occasion":"Memorial Day Weekend","premium":"1.6x","suggestedRate":0,"minStay":3,"tip":"first big summer weekend"},
      {"occasion":"4th of July","premium":"1.7x","suggestedRate":0,"minStay":3,"tip":"price aggressively"},
      {"occasion":"Labor Day Weekend","premium":"1.5x","suggestedRate":0,"minStay":3,"tip":"last summer hurrah"},
      {"occasion":"Local Festivals","premium":"1.3-2x","suggestedRate":0,"minStay":2,"tip":"monitor event calendar"}
    ],
    "weekly":{"discount":"10-15%","suggestedWeekly":0,"tip":"increases occupancy 20-30%"},
    "monthly":{"discount":"25-35%","suggestedMonthly":0,"tip":"eliminates turnover costs"},
    "revenueProjection":{"conservative":0,"moderate":0,"optimistic":0,"topTip":"dynamic pricing tip"}
  }` : ''}
}`;

      let mainResult = {};
      try {
        mainResult = await callAI([{ role: 'user', content: mainPrompt }]);
      } catch(e) {
        // If only photos selected, continue with empty property data
        if (!wantOTA && !wantPricing && !wantRules && !wantSEO && !wantMarket) {
          mainResult = { property: { title: 'Property', address: url, type: 'Vacation Rental', bedrooms: 0, bathrooms: 0, guests: 0, sqft: 0, highlights: [], nearbyAttractions: [] } };
        } else {
          throw e;
        }
      }

      // Use uploaded photos if available, otherwise use scraped
      if (uploadedPhotos.length > 0 && wantPhotos) {
        photoBase64List = uploadedPhotos.map(p => ({ url: p.url, base64: p.base64, mediaType: p.mediaType }));
      }

      // STEP 2.5: Analyze photos with Claude Vision
      if (wantPhotos && photoBase64List.some(p => p.base64)) {
        setLoadingStep('👁️ Analyzing photos with AI vision...');
        const photosWithData = photoBase64List.filter(p => p.base64);
        
        try {
          // Split into batches of 20 for vision API
          const batchSize = 20;
          const batches = [];
          for (let i = 0; i < photosWithData.length; i += batchSize) {
            batches.push(photosWithData.slice(i, i + batchSize));
          }

          const batchPromises = batches.map((batch, batchIdx) => {
            const batchMessages = [
              {
                role: 'user',
                content: [
                  ...batch.map(p => ({
                    type: 'image',
                    source: { type: 'base64', media_type: p.mediaType || 'image/jpeg', data: p.base64 }
                  })),
                  {
                    type: 'text',
                    text: 'You are a vacation rental copywriter. Look at all ' + batch.length + ' photos. For each write ONE short punchy sentence (max 15 words) that highlights the best feature visible. Be specific and evocative — no generic phrases. Return ONLY valid JSON: {"photos": [{"room": "short room name", "emoji": "matching emoji", "description": "one punchy sentence max 15 words"}]}'
                  }
                ]
              }
            ];
            return callAI(batchMessages, 4000);
          });

          const batchResults = await Promise.all(batchPromises);
          const allPhotos = batchResults.flatMap((r, batchIdx) =>
            (r.photos || []).map((p, i) => ({
              ...p,
              imageUrl: batches[batchIdx][i]?.url
            }))
          );

          if (allPhotos.length > 0) {
            mainResult.photos = allPhotos;
          }
        } catch(e) {
          console.log('Vision analysis failed:', e.message);
          // Fall back to scraped images with generic descriptions
          if (scrapedImages.length > 0) {
            mainResult.photos = scrapedImages.slice(0, photoLimit).map((imgUrl, i) => ({
              room: 'Photo ' + (i + 1),
              emoji: '📸',
              description: 'Property photo ' + (i + 1),
              imageUrl: imgUrl
            }));
          }
        }
      }

      // STEP 3: OTA Headlines + Descriptions (batched)
      let otas = [];
      if (wantOTA && selectedOTAs.size > 0) {
        setLoadingStep('✍️ Writing platform copy...');
        const otaList = [...selectedOTAs];
        const nearby = (mainResult.property?.nearbyAttractions || []).join(', ');
            const propInfo = 'Property: ' + (mainResult.property?.title || 'Vacation Rental') + '\nLocation: ' + (mainResult.property?.address || url) + '\nType: ' + (mainResult.property?.type || 'vacation rental') + ', ' + (mainResult.property?.bedrooms || 0) + ' bedrooms, ' + (mainResult.property?.guests || 0) + ' guests\nNearby attractions: ' + nearby + (scrapedContext ? '\nUse the real property data.' : '') + (customPrompt ? '\nSPECIAL INSTRUCTIONS: ' + customPrompt : '');

        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < otaList.length; i += batchSize) {
          batches.push(otaList.slice(i, i + batchSize));
        }

        const batchPromises = batches.map(batch => {
          const limitsText = batch.map(p => `- ${p}: MAX ${CHAR_LIMITS[p]} chars`).join('\n');
          const template = batch.map(p => `{"platform":"${p}","icon":"${OTA_META[p]?.icon || '🏠'}","charLimit":${CHAR_LIMITS[p]},"headlines":["headline 1","headline 2","headline 3","headline 4","headline 5","headline 6","headline 7","headline 8","headline 9","headline 10"],"shortDesc":"2-sentence hook","fullBody":"Full 4-5 sentence listing description","tags":["tag1","tag2","tag3"]}`).join(',\n');

          const prompt = `You are an expert vacation rental copywriter.
${propInfo}

Write OTA listings for ONLY these ${batch.length} platforms: ${batch.join(', ')}.

STRICT CHARACTER LIMITS — every headline MUST be within limit:
${limitsText}

For each platform write 10 DIFFERENT headline variations. Each must be unique.
CRITICAL CHARACTER RULES — MOST IMPORTANT INSTRUCTION:
Every headline MUST use 95-100% of the platform character limit. Count every character.
Here are the EXACT targets for each platform:
- Airbnb (50): target 48-50 chars
- VRBO (75): target 72-75 chars
- Booking.com (60): target 57-60 chars
- TripAdvisor (80): target 76-80 chars
- Google Vacation Rentals (100): target 95-100 chars
- Hipcamp (60): target 57-60 chars
- Expedia (120): target 114-120 chars
- Hotels.com (100): target 95-100 chars
- Agoda (80): target 76-80 chars
- Kayak (90): target 85-90 chars
- Homes and Villas by Marriott (100): target 95-100 chars
- Plum Guide (60): target 57-60 chars
- Houfy (75): target 72-75 chars
- Vacasa (80): target 76-80 chars
- Evolve (75): target 72-75 chars
- Furnished Finder (80): target 76-80 chars
- Glamping Hub (60): target 57-60 chars
- Misterbnb (75): target 72-75 chars

HOW TO HIT THE LIMIT: Combine property name, bedrooms, location, nearby attraction, key amenity, separator chars
If headline is too short: add more details like "Sleeps 8", "Hot Tub", "Game Room", "Near [attraction]", "Mountain Views", "Private Yard"
NEVER submit a headline under 90% of the limit.

Return ONLY valid JSON:
{"otas": [
${template}
]}`;

          return callAI([{ role: 'user', content: prompt }], 6000);
        });

        setLoadingStep('⚡ Generating all platforms in parallel...');
        const batchResults = await Promise.all(batchPromises);
        otas = batchResults.flatMap(r => r.otas || []);
      }

      console.log('Scraped images found:', scrapedImages.length, scrapedImages.slice(0,3));

      // Attach images to photos
      const imageSourceList = uploadedPhotos.length > 0 
        ? uploadedPhotos.map(p => p.url)
        : scrapedImages;

      if (imageSourceList.length > 0) {
        if (!mainResult.photos || mainResult.photos.length === 0) {
          mainResult.photos = imageSourceList.slice(0, photoLimit).map((imgUrl, i) => ({
            room: 'Photo ' + (i + 1),
            emoji: '📸',
            description: '',
            imageUrl: imgUrl
          }));
        } else {
          mainResult.photos = mainResult.photos.map((p, i) => ({
            ...p,
            imageUrl: p.imageUrl || imageSourceList[i] || null
          }));
        }
      }
      setResult({ ...mainResult, otas, scrapedImages });
      setActiveTab(selectedFeatures.has('ota') ? 'ota' : [...selectedFeatures][0]);
      setLoadingStep('');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const runAudit = async () => {
    const auditTarget = auditUrl || url;
    if (!auditTarget) return;
    setAuditLoading(true);
    setAuditResult(null);
    try {
      // Scrape audit target
      let auditContext = '';
      try {
        const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: auditTarget }) });
        const s = await r.json();
        if (s.success) auditContext = `Title: ${s.title}\nDescription: ${s.metaDescription}\nContent: ${s.text}`;
      } catch {}

      const prompt = `You are a vacation rental listing auditor.
URL: ${auditTarget}
${auditContext ? `REAL LISTING DATA:\n${auditContext}` : ''}

Audit this listing and return ONLY valid JSON:
{
  "score": 0,
  "grade": "B",
  "verdict": "one line verdict",
  "summary": "2-3 sentence summary",
  "categories": [
    {"name":"Headline and Title","icon":"✍️","score":0,"issues":[
      {"type":"error","text":"issue description","fix":"how to fix"}
    ]},
    {"name":"Description Quality","icon":"📝","score":0,"issues":[]},
    {"name":"Photo Coverage","icon":"📸","score":0,"issues":[]},
    {"name":"SEO and Discoverability","icon":"🔍","score":0,"issues":[]},
    {"name":"Trust and Conversion","icon":"⭐","score":0,"issues":[]},
    {"name":"Pricing and Value","icon":"💰","score":0,"issues":[]}
  ],
  "topFixes": [
    {"priority":"high","title":"fix title","description":"why it matters","suggestion":"example fix"}
  ]
}`;

      const data = await callAI([{ role: 'user', content: prompt }]);
      setAuditResult(data);
    } catch (err) {
      setAuditResult({ error: err.message });
    } finally {
      setAuditLoading(false);
    }
  };

  const copy = (text, btn) => {
    navigator.clipboard.writeText(text).then(() => {
      if (btn) {
        const orig = btn.textContent;
        const origBg = btn.style.background;
        const origColor = btn.style.color;
        btn.textContent = '✓ Copied!';
        btn.style.background = '#34c759';
        btn.style.color = 'white';
        btn.style.borderColor = '#34c759';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = origBg;
          btn.style.color = origColor;
          btn.style.borderColor = '';
        }, 2000);
      }
    });
  };

  const s = {
    // Styles object
    section: { background: '#f5f5f7', padding: '80px 48px' },
    inner: { maxWidth: 800, margin: '0 auto' },
    label: { fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600, color: '#6e6e73', marginBottom: 20 },
    card: { background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
    cardHeader: { padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafaf8' },
    cardBody: { padding: 20 },
    btn: { padding: '10px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' },
    input: { width: '100%', padding: '14px 18px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' },
    textarea: { width: '100%', border: '1px solid transparent', borderRadius: 6, padding: 8, fontFamily: 'inherit', fontSize: '0.83rem', lineHeight: 1.6, resize: 'vertical', background: 'transparent', color: '#1d1d1f' },
  };

  const activeFeatures = [...selectedFeatures];

  return (
    <section id="tool" style={{ background: '#f5f5f7', padding: '100px 24px 80px', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12 }}>Try it now — free</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#1d1d1f', marginBottom: 12 }}>
            Paste a URL.<br />Get everything.
          </h2>
          <p style={{ fontSize: '1rem', color: '#6e6e73', lineHeight: 1.7 }}>
            VR365 scans the real listing, reads the property details, and generates publish-ready copy for every platform you select.
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: 4, marginBottom: 16, gap: 4 }}>
          {[['url', '🔗 Paste URL', 'Scan any listing automatically'], ['manual', '✏️ Enter Manually', 'Type property details yourself']].map(([mode, label, desc]) => (
            <button key={mode} onClick={() => setInputMode(mode)}
              style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                background: inputMode === mode ? '#1d1d1f' : 'transparent',
                color: inputMode === mode ? 'white' : '#6e6e73' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>

        {/* URL Input */}
        {inputMode === 'url' && (
          <div style={{ display: 'flex', border: '2px solid #1d1d1f', borderRadius: 8, overflow: 'hidden', background: 'white', marginBottom: 16 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="Paste any property URL — Airbnb, VRBO, your own website..."
              style={{ flex: 1, padding: '16px 20px', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', color: '#1d1d1f' }}
            />
          </div>
        )}

        {/* Photo Upload for URL mode - shown when photos feature selected */}
        {inputMode === 'url' && selectedFeatures.has('photos') && (
          <div style={{ marginBottom: 16 }}>
            <div
              onClick={() => document.getElementById('urlModePhotoInput').click()}
              style={{ border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 8, padding: '14px 20px', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ fontSize: '1.4rem' }}>📸</span>
              <div>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1d1d1f' }}>
                  {uploadedPhotos.length > 0 ? uploadedPhotos.length + ' photos ready for AI analysis' : 'Upload photos for better descriptions (optional)'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#86868b' }}>
                  {uploadedPhotos.length > 0 ? 'AI will describe each photo — click to add more' : 'Your site uses lazy loading — upload photos directly for accurate descriptions'}
                </div>
              </div>
              {uploadedPhotos.length > 0 && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  {uploadedPhotos.slice(0, 5).map((p, i) => (
                    <img key={i} src={p.url} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(201,168,76,0.4)' }} />
                  ))}
                  {uploadedPhotos.length > 5 && <div style={{ width: 36, height: 36, borderRadius: 4, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#6e6e73' }}>+{uploadedPhotos.length - 5}</div>}
                </div>
              )}
            </div>
            <input
              id="urlModePhotoInput"
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setUploadedPhotos(prev => [...prev, {
                      url: URL.createObjectURL(file),
                      base64: ev.target.result.split(',')[1],
                      mediaType: file.type || 'image/jpeg',
                      name: file.name
                    }]);
                  };
                  reader.readAsDataURL(file);
                });
              }}
            />
          </div>
        )}

        {/* Manual Entry Form */}
        {inputMode === 'manual' && (
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6e6e73' }}>
              Property Details
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'title', label: 'Property Name', placeholder: 'e.g. Cedar and Sage Mountain Retreat', full: true },
                { key: 'address', label: 'Location', placeholder: 'e.g. Suncadia, Washington', full: true },
                { key: 'type', label: 'Property Type', placeholder: 'e.g. Mountain Cabin, Beach House' },
                { key: 'bedrooms', label: 'Bedrooms', placeholder: '6' },
                { key: 'bathrooms', label: 'Bathrooms', placeholder: '4.5' },
                { key: 'guests', label: 'Max Guests', placeholder: '18' },
                { key: 'sqft', label: 'Square Feet', placeholder: '4500' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? 'span 2' : 'span 1' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6e6e73', marginBottom: 4 }}>{f.label}</div>
                  <input
                    value={manualData[f.key]}
                    onChange={e => setManualData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', color: '#1d1d1f' }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6e6e73', marginBottom: 4 }}>Key Amenities</div>
                <textarea
                  value={manualData.amenities}
                  onChange={e => setManualData(prev => ({ ...prev, amenities: e.target.value }))}
                  placeholder="e.g. Private swim spa, hot tub, game room with shuffleboard, mountain views, chef kitchen..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', resize: 'vertical', minHeight: 70, color: '#1d1d1f' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6e6e73', marginBottom: 4 }}>Nearby Attractions <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(used in headlines)</span></div>
                <input
                  value={manualData.nearbyAttractions}
                  onChange={e => setManualData(prev => ({ ...prev, nearbyAttractions: e.target.value }))}
                  placeholder="e.g. Suncadia Resort, Cle Elum Lake, Iron Horse Trail, Roslyn..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', color: '#1d1d1f' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6e6e73', marginBottom: 4 }}>Existing Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                <textarea
                  value={manualData.description}
                  onChange={e => setManualData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Paste your existing description here if you have one..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none', resize: 'vertical', minHeight: 80, color: '#1d1d1f' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Feature Selector */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6e6e73' }}>
            What do you want to generate?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(0,0,0,0.05)' }}>
            {FEATURES.map(f => {
              const active = selectedFeatures.has(f.id);
              return (
                <div key={f.id} onClick={() => toggleFeature(f.id)}
                  style={{ background: active ? '#fffdf5' : 'white', padding: '14px 12px', cursor: 'pointer', position: 'relative', transition: 'background 0.15s' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 6, opacity: active ? 1 : 0.35 }}>{f.icon}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: active ? '#1d1d1f' : '#6e6e73', marginBottom: 3 }}>{f.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#86868b', lineHeight: 1.4 }}>{f.desc}</div>
                  {active && <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: '#c9a84c', color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✓</div>}
                </div>
              );
            })}
          </div>
          <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: '#6e6e73' }}>{selectedFeatures.size} of 8 selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['All', () => setSelectedFeatures(new Set(FEATURES.map(f => f.id)))], ['Clear', () => setSelectedFeatures(new Set())]].map(([label, fn]) => (
                <button key={label} onClick={fn} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 600, color: '#6e6e73', cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* OTA Platform Selector - shows when OTA features selected */}
        {(selectedFeatures.has('ota') || selectedFeatures.has('otadesc')) && (
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6e6e73' }}>
              Which platforms?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(0,0,0,0.05)' }}>
              {ALL_OTAS.map(name => {
                const active = selectedOTAs.has(name);
                return (
                  <div key={name} onClick={() => toggleOTA(name)}
                    style={{ background: active ? '#fffdf5' : 'white', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', transition: 'background 0.15s' }}>
                    <span style={{ fontSize: '1.1rem', opacity: active ? 1 : 0.4 }}>{OTA_META[name]?.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: active ? '#1d1d1f' : '#6e6e73' }}>{name}</div>
                      <div style={{ fontSize: '0.62rem', color: '#c9a84c', fontWeight: 700 }}>{CHAR_LIMITS[name]} chars</div>
                    </div>
                    {active && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.65rem', fontWeight: 900, color: '#c9a84c' }}>✓</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#6e6e73' }}>{selectedOTAs.size} of 18 selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['All', () => setSelectedOTAs(new Set(ALL_OTAS))], ['Popular 4', () => setSelectedOTAs(new Set(POPULAR_OTAS))], ['Clear', () => setSelectedOTAs(new Set())]].map(([label, fn]) => (
                  <button key={label} onClick={fn} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 600, color: '#6e6e73', cursor: 'pointer' }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload - shows when photos selected */}
        {selectedFeatures.has('photos') && (
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6e6e73', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Upload your photos (optional)</span>
              {uploadedPhotos.length > 0 && <span style={{ color: '#c9a84c', fontWeight: 700 }}>{uploadedPhotos.length} uploaded</span>}
            </div>
            <div style={{ padding: 16 }}>
              <div
                onClick={() => document.getElementById('photoUploadInput').click()}
                style={{ border: '2px dashed rgba(0,0,0,0.12)', borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#fafaf8' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>📸</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>Click to upload property photos</div>
                <div style={{ fontSize: '0.72rem', color: '#86868b' }}>JPG, PNG, WEBP — AI will describe each one</div>
              </div>
              <input
                id="photoUploadInput"
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const files = Array.from(e.target.files);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setUploadedPhotos(prev => [...prev, {
                        url: URL.createObjectURL(file),
                        base64: ev.target.result.split(',')[1],
                        mediaType: file.type || 'image/jpeg',
                        name: file.name
                      }]);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              />
              {uploadedPhotos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {uploadedPhotos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p.url} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '2px solid rgba(201,168,76,0.4)' }} />
                      <button onClick={() => setUploadedPhotos(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ff3b30', border: 'none', color: 'white', fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setUploadedPhotos([])}
                    style={{ padding: '4px 10px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer', color: '#86868b', alignSelf: 'center' }}>Clear all</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo Limit Selector - shows when photos selected and no uploads */}
        {selectedFeatures.has('photos') && uploadedPhotos.length === 0 && (
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6e6e73' }}>
              How many photos to analyze?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(0,0,0,0.05)' }}>
              {[
                { count: 5, label: '5 photos', cost: '~$0.05', desc: 'Key rooms only' },
                { count: 10, label: '10 photos', cost: '~$0.08', desc: 'Main spaces' },
                { count: 20, label: '20 photos', cost: '~$0.14', desc: 'Full coverage' },
                { count: 40, label: '40 photos', cost: '~$0.25', desc: 'Every photo' },
              ].map(opt => (
                <div key={opt.count} onClick={() => setPhotoLimit(opt.count)}
                  style={{ background: photoLimit === opt.count ? '#fffdf5' : 'white', padding: '14px 12px', cursor: 'pointer', textAlign: 'center', transition: 'background 0.15s', position: 'relative', borderBottom: photoLimit === opt.count ? '2px solid #c9a84c' : '2px solid transparent' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: photoLimit === opt.count ? '#c9a84c' : '#1d1d1f', marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#86868b', marginBottom: 4 }}>{opt.desc}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: photoLimit === opt.count ? '#c9a84c' : '#86868b', background: photoLimit === opt.count ? 'rgba(201,168,76,0.1)' : '#f5f5f7', padding: '2px 8px', borderRadius: 10, display: 'inline-block' }}>{opt.cost}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.75rem', color: '#86868b' }}>
              💡 AI will look at each photo and write what it actually sees — real room names, real details
            </div>
          </div>
        )}
        

        {/* Custom Prompt */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowPrompt(!showPrompt)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, color: '#6e6e73', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem' }}>{showPrompt ? '▾' : '▸'}</span>
            Add custom instructions to AI <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
          </button>
          {showPrompt && (
            <div style={{ marginTop: 8 }}>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Examples: Focus on outdoor spaces, Write in luxury tone, Target families with kids, Target remote workers, Make it fun and casual" 
                style={{ width: '100%', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', resize: 'vertical', minHeight: 100, color: '#1d1d1f', lineHeight: 1.6, background: 'white' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {[
                  'Luxury tone',
                  'Fun and casual',
                  'Focus on outdoor spaces',
                  'Target families with kids',
                  'Target remote workers',
                  'Pet friendly focus',
                  'Romantic getaway',
                  'Adventure seekers',
                ].map(suggestion => (
                  <button key={suggestion} onClick={() => setCustomPrompt(prev => prev ? prev + ', ' + suggestion.toLowerCase() : suggestion.toLowerCase())}
                    style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.12)', background: 'white', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 500, color: '#6e6e73', cursor: 'pointer' }}>
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button onClick={analyze} disabled={loading}
          style={{ width: '100%', padding: 16, background: loading ? '#bbb' : '#1d1d1f', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 8, transition: 'all 0.2s' }}>
          {loading ? loadingStep || 'Analyzing...' : selectedFeatures.size === 0 ? 'Select features above →' : `Generate: ${[...selectedFeatures].map(f => FEATURES.find(x => x.id === f)?.name).filter(Boolean).join(' · ')} →`}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#86868b', marginBottom: 8 }}>
          Works with <strong>Airbnb</strong> · <strong>VRBO</strong> · <strong>Zillow</strong> · <strong>Realtor.com</strong> · <strong>Any URL</strong>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: 8, padding: 20, textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 4 }}>⚠️ Something went wrong</div>
            <div style={{ fontSize: '0.85rem', color: '#6e6e73' }}>{error}</div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 32 }}>

            {/* Property Header - Editable */}
            <div style={{ background: '#1d1d1f', color: 'white', borderRadius: 12, padding: '32px 36px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <input
                  defaultValue={result.property?.title}
                  onChange={e => result.property.title = e.target.value}
                  style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '100%', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <input
                defaultValue={result.property?.address}
                onChange={e => result.property.address = e.target.value}
                style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: 16, background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontFamily: 'inherit', width: '100%' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                {[
                  { label: 'Bedrooms', key: 'bedrooms', suffix: 'bed' },
                  { label: 'Bathrooms', key: 'bathrooms', suffix: 'bath' },
                  { label: 'Guests', key: 'guests', suffix: 'guests' },
                  { label: 'Sqft', key: 'sqft', suffix: 'sqft' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: i === 0 ? '#c9a84c' : 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 10px' }}>
                    <input
                      defaultValue={result.property?.[f.key] && result.property?.[f.key] !== 'null' && result.property?.[f.key] !== null ? result.property[f.key] : ''}
                      onChange={e => result.property[f.key] = e.target.value}
                      style={{ width: 52, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600, color: i === 0 ? '#000' : 'white', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: i === 0 ? '#000' : 'rgba(255,255,255,0.7)' }}>{f.suffix}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>✏️ Click any field above to edit</div>
              {result.property?.nearbyAttractions?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>📍 Nearby used in headlines</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {result.property.nearbyAttractions.map((a, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.2)', color: 'rgba(255,255,255,0.7)' }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid rgba(0,0,0,0.08)', marginBottom: 24, overflowX: 'auto' }}>
              {FEATURES.filter(f => selectedFeatures.has(f.id)).map(f => (
                <button key={f.id} onClick={() => setActiveTab(f.id)}
                  style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.83rem', fontWeight: activeTab === f.id ? 600 : 400, color: activeTab === f.id ? '#c9a84c' : '#6e6e73', borderBottom: activeTab === f.id ? '2px solid #c9a84c' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  {f.icon} {f.name}
                </button>
              ))}

            </div>

            {/* OTA HEADLINES TAB */}
            {activeTab === 'ota' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                  {(result.otas || []).map((ota, oi) => {
                    const headlines = Array.isArray(ota.headlines) ? ota.headlines : ota.headline ? [ota.headline] : [];
                    const limit = ota.charLimit || CHAR_LIMITS[ota.platform] || 50;
                    return (
                      <div key={oi} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem' }}>
                            <span>{ota.icon}</span>{ota.platform}
                          </div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}>Max {limit} chars</span>
                        </div>
                        <div style={{ padding: 16 }}>
                          {headlines.length === 0 ? (
                            <div style={{ color: '#86868b', fontSize: '0.83rem' }}>No headlines generated</div>
                          ) : headlines.map((h, hi) => {
                            const len = h.length;
                            const over = len > limit;
                            const near = len >= limit * 0.9;
                            const cc = over ? '#c62828' : near ? '#f57f17' : '#34c759';
                            return (
                              <div key={hi} style={{ marginBottom: 10, padding: 10, background: '#f9f9f9', borderRadius: 6, border: `1px solid ${over ? '#ffcccc' : 'rgba(0,0,0,0.06)'}` }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#86868b', flexShrink: 0, marginTop: 2 }}>#{hi + 1}</span>
                                  <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: '#1d1d1f', lineHeight: 1.4 }}>{h}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}>
                                    <div style={{ height: '100%', width: `${Math.min(100, (len / limit) * 100)}%`, background: cc, borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cc }}>{len}/{limit}</span>
                                  <button onClick={e => copy(h, e.target)} style={{ padding: '2px 8px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', borderRadius: 4, fontFamily: 'inherit', fontSize: '0.68rem', cursor: 'pointer' }}>Copy</button>
                                </div>
                              </div>
                            );
                          })}
                          {headlines.length > 0 && (
                            <button onClick={e => copy(headlines.map((h, i) => `${i + 1}. ${h}`).join('\n'), e.target)}
                              style={{ width: '100%', padding: '8px', border: '1px solid rgba(0,0,0,0.1)', background: '#f5f5f7', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                              Copy all {headlines.length} headlines
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OTA DESCRIPTIONS TAB */}
            {activeTab === 'otadesc' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {(result.otas || []).map((ota, oi) => (
                  <div key={oi} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#fafaf8', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>{ota.icon}</span>{ota.platform}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#86868b', marginBottom: 4 }}>Short Hook</div>
                      <textarea defaultValue={ota.shortDesc || ''} style={{ ...s.textarea, minHeight: 60, marginBottom: 12, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 10 }} />
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#86868b', marginBottom: 4 }}>Full Listing Body</div>
                      <textarea defaultValue={ota.fullBody || ''} style={{ ...s.textarea, minHeight: 120, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 10, marginBottom: 10 }} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {(ota.tags || []).map((t, i) => <span key={i} style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20, background: '#f5f5f7', color: '#6e6e73' }}>{t}</span>)}
                      </div>
                      <button onClick={e => copy(`${ota.shortDesc}\n\n${ota.fullBody}`, e.target)}
                        style={{ width: '100%', padding: 9, border: '1px solid rgba(0,0,0,0.1)', background: '#f5f5f7', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        Copy description
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PHOTOS TAB */}
            {activeTab === 'photos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {(result.photos || []).map((p, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                    {(p.imageUrl || (result.scrapedImages && result.scrapedImages[i])) ? (
                      <img 
                        src={p.imageUrl || result.scrapedImages[i]}
                        alt={p.room || 'Photo'}
                        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} 
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg, #e8e0d4, #f5f5f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>{p.emoji || '📸'}</div>
                    )}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#c9a84c', marginBottom: 5 }}>{p.room}</div>
                      <textarea defaultValue={p.description} style={{ ...s.textarea, minHeight: 70, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: '0.8rem', color: '#6e6e73' }} />
                      <button onClick={e => copy(p.description, e.target)} style={{ width: '100%', padding: 8, border: '1px solid rgba(0,0,0,0.1)', background: '#f5f5f7', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Copy description</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PRICING TAB */}
            {activeTab === 'pricing' && result.pricing && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                  {(result.pricing.platforms || []).map((p, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#6e6e73', marginBottom: 8 }}>{p.name}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#1d1d1f' }}>${p.low}–${p.high}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6e6e73' }}>/night</span></div>
                      <div style={{ fontSize: '0.75rem', color: '#6e6e73', marginTop: 4 }}>Avg ${p.avg}/night</div>
                      <div style={{ marginTop: 8, background: '#f5f5f7', borderRadius: 4, padding: '5px 10px', fontSize: '0.72rem', color: '#6e6e73' }}>Est. {p.occupancy} occupancy</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>📊 Pricing Strategy</div>
                  <p style={{ fontSize: '0.88rem', color: '#6e6e73', lineHeight: 1.7, marginBottom: 12 }}>{result.pricing.notes}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: '#f5f5f7', padding: '12px 18px', borderRadius: 8, fontSize: '0.82rem' }}>
                      <strong>Weekend Premium</strong><br /><span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1.1rem' }}>{result.pricing.weekendPremium}</span>
                    </div>
                    <div style={{ background: '#f5f5f7', padding: '12px 18px', borderRadius: 8, fontSize: '0.82rem', flex: 1 }}>
                      <strong>Seasonal Tip</strong><br /><span style={{ color: '#6e6e73' }}>{result.pricing.seasonalTip}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RULES TAB */}
            {activeTab === 'rules' && result.rules && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 14 }}>🏠 House Rules</div>
                  <div style={{ background: '#f5f5f7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.83rem' }}>
                    <strong>Check-in:</strong> {result.rules.checkIn}  ·  <strong>Check-out:</strong> {result.rules.checkOut}
                  </div>
                  {(result.rules.items || []).map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.83rem', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>{r.icon}</span><span>{r.rule}</span>
                    </div>
                  ))}
                  <button onClick={e => copy((result.rules.items || []).map(r => `${r.icon} ${r.rule}`).join('\n'), e.target)}
                    style={{ width: '100%', padding: 9, border: '1px solid rgba(0,0,0,0.1)', background: '#f5f5f7', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginTop: 14 }}>
                    Copy all rules
                  </button>
                </div>
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 14 }}>❓ Guest FAQ</div>
                  {(result.rules.faq || []).map((f, i) => (
                    <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: 4 }}>{f.q}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6e6e73', lineHeight: 1.6 }}>{f.a}</div>
                    </div>
                  ))}
                  <button onClick={e => copy((result.rules.faq || []).map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n'), e.target)}
                    style={{ width: '100%', padding: 9, border: '1px solid rgba(0,0,0,0.1)', background: '#f5f5f7', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginTop: 14 }}>
                    Copy all FAQ
                  </button>
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && result.seo && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                  {[['Primary Keywords', result.seo.primaryKeywords], ['Long-tail Keywords', result.seo.longTailKeywords], ['Local Keywords', result.seo.localKeywords]].map(([label, kws]) => (
                    <div key={label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#6e6e73', marginBottom: 12 }}>{label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(kws || []).map((k, i) => <span key={i} style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, background: '#fffde7', color: '#7a6800', border: '1px solid #f0d000' }}>{k}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24 }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#6e6e73', marginBottom: 4 }}>Title Tag ({(result.seo.titleTag || '').length}/60 chars)</div>
                    <textarea defaultValue={result.seo.titleTag} style={{ ...s.textarea, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 10, minHeight: 40, fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: '#6e6e73', marginBottom: 4 }}>Meta Description ({(result.seo.metaDescription || '').length}/155 chars)</div>
                    <textarea defaultValue={result.seo.metaDescription} style={{ ...s.textarea, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 10, minHeight: 60, fontSize: '0.85rem' }} />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    {(result.seo.tips || []).map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.83rem', color: '#6e6e73' }}>
                        <span style={{ color: '#c9a84c', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MARKET TAB */}
            {activeTab === 'market' && result.market && (
              <MarketTab market={result.market} property={result.property} />
            )}

            {/* AUDIT TAB */}
            {activeTab === 'audit' && (
              <AuditTab url={url} onRunAudit={runAudit} auditUrl={auditUrl} setAuditUrl={setAuditUrl} loading={auditLoading} result={auditResult} />
            )}

          </div>
        )}
      </div>
    </section>
  );
}

function MarketTab({ market: m, property }) {
  if (!m) return null;
  const posColor = (m.position || '').includes('below') ? '#c9a84c' : '#34c759';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Your Rate', val: `$${m.yourRate?.avg}`, sub: `$${m.yourRate?.low}–$${m.yourRate?.high}`, color: '#1d1d1f' },
          { label: 'Market Average', val: `$${m.marketAvg?.avg}`, sub: `Competitors: $${m.competitorRange?.low}–$${m.competitorRange?.high}`, color: '#2e6fad' },
          { label: 'Your Position', val: m.position, sub: '', color: posColor },
          { label: 'Annual Est.', val: `$${(m.revenueProjection?.moderate || 0).toLocaleString()}`, sub: `$${(m.revenueProjection?.conservative || 0).toLocaleString()}–$${(m.revenueProjection?.optimistic || 0).toLocaleString()}`, color: '#34c759' },
        ].map((item, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#6e6e73', marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: i === 2 ? '0.85rem' : '1.8rem', fontWeight: 900, color: item.color, letterSpacing: i === 2 ? 0 : '-0.03em', lineHeight: 1.2, marginBottom: 4 }}>{item.val}</div>
            {item.sub && <div style={{ fontSize: '0.72rem', color: '#6e6e73' }}>{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Seasonal */}
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600, color: '#6e6e73', marginBottom: 14 }}>Seasonal Pricing</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {(m.seasonal || []).map((s, i) => {
          const pct = Math.round((s.multiplier - 1) * 100);
          const col = s.multiplier >= 1.3 ? '#34c759' : s.multiplier >= 1 ? '#c9a84c' : '#ff3b30';
          const bg = s.multiplier >= 1.3 ? '#e8f5e9' : s.multiplier >= 1 ? '#fffde7' : '#fff5f5';
          return (
            <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1d1d1f' }}>{s.period}</div>
                <span style={{ background: bg, color: col, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{pct >= 0 ? '+' : ''}{pct}%</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1d1d1f', letterSpacing: '-0.03em' }}>${s.suggestedRate}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#6e6e73' }}>/night</span></div>
              <div style={{ fontSize: '0.75rem', color: '#6e6e73', marginTop: 4 }}>{s.notes}</div>
            </div>
          );
        })}
      </div>

      {/* Occasions */}
      <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 600, color: '#6e6e73', marginBottom: 14 }}>Special Occasion Pricing</div>
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
        {(m.occasions || []).map((o, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, padding: '14px 20px', borderBottom: i < m.occasions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'white' : '#fafaf8' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{o.occasion}</div>
            <span style={{ background: '#fffde7', color: '#f57f17', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 10, textAlign: 'center' }}>{o.premium}</span>
            <div style={{ fontWeight: 700, color: '#34c759', fontSize: '1rem', textAlign: 'center' }}>${o.suggestedRate}</div>
            <div style={{ fontSize: '0.72rem', color: '#6e6e73' }}>{o.tip}</div>
          </div>
        ))}
      </div>

      {/* Weekly / Monthly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {[
          { label: '📅 Weekly Stays', rate: m.weekly?.suggestedWeekly, period: '/week', discount: m.weekly?.discount, tip: m.weekly?.tip },
          { label: '📆 Monthly Stays', rate: m.monthly?.suggestedMonthly, period: '/month', discount: m.monthly?.discount, tip: m.monthly?.tip },
        ].map((item, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 22 }}>
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: '#6e6e73', marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 4 }}>${(item.rate || 0).toLocaleString()}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6e6e73' }}>{item.period}</span></div>
            <div style={{ fontSize: '0.8rem', color: '#c9a84c', fontWeight: 700, marginBottom: 8 }}>{item.discount} discount</div>
            <div style={{ fontSize: '0.78rem', color: '#6e6e73', lineHeight: 1.6 }}>{item.tip}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: 22 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>💡 Top Revenue Tip</div>
        <div style={{ fontSize: '0.85rem', color: '#6e6e73', lineHeight: 1.7 }}>{m.revenueProjection?.topTip}</div>
      </div>
    </div>
  );
}

function AuditTab({ url, onRunAudit, auditUrl, setAuditUrl, loading, result }) {
  return (
    <div>
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>🩺 Audit Any Listing</div>
        <div style={{ fontSize: '0.85rem', color: '#6e6e73', marginBottom: 18 }}>Paste any live listing URL to get a health score, mistakes found, and AI fix suggestions.</div>
        <div style={{ display: 'flex', gap: 0, border: '2px solid #1d1d1f', borderRadius: 6, overflow: 'hidden' }}>
          <input value={auditUrl} onChange={e => setAuditUrl(e.target.value)} placeholder="Paste listing URL to audit..."
            style={{ flex: 1, padding: '12px 16px', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          <button onClick={onRunAudit} disabled={loading}
            style={{ padding: '12px 20px', background: '#1d1d1f', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>
            {loading ? 'Auditing...' : 'Run Audit →'}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#6e6e73' }}>
          Or <button onClick={() => setAuditUrl(url)} style={{ background: 'none', border: 'none', color: '#c9a84c', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem' }}>use the listing already analyzed above</button>
        </div>
      </div>

      {result?.error && <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: 8, padding: 20, color: '#c62828', fontSize: '0.85rem' }}>⚠️ {result.error}</div>}

      {result && !result.error && (
        <div>
          {/* Score */}
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 32, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none" stroke={result.score >= 80 ? '#34c759' : result.score >= 60 ? '#c9a84c' : '#ff3b30'} strokeWidth="10"
                  strokeDasharray={`${(result.score / 100) * 301.6} 301.6`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: result.score >= 80 ? '#34c759' : result.score >= 60 ? '#c9a84c' : '#ff3b30' }}>{result.score}</div>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 1, color: '#6e6e73' }}>Score</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6, color: result.score >= 80 ? '#34c759' : result.score >= 60 ? '#c9a84c' : '#ff3b30' }}>{result.grade}</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{result.verdict}</div>
              <div style={{ fontSize: '0.85rem', color: '#6e6e73', lineHeight: 1.6, maxWidth: 400 }}>{result.summary}</div>
            </div>
          </div>

          {/* Categories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
            {(result.categories || []).map((cat, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>{cat.icon} {cat.name}</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cat.score >= 75 ? '#e8f5e9' : cat.score >= 55 ? '#fffde7' : '#fce4ec', color: cat.score >= 75 ? '#2e7d32' : cat.score >= 55 ? '#f57f17' : '#c62828' }}>{cat.score}/100</span>
                </div>
                {(cat.issues || []).map((issue, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: j < cat.issues.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', fontSize: '0.8rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: issue.type === 'error' ? '#ff3b30' : issue.type === 'warn' ? '#c9a84c' : '#34c759' }} />
                    <div>
                      <div style={{ color: '#1d1d1f' }}>{issue.text}</div>
                      {issue.fix && <div style={{ fontSize: '0.75rem', color: '#34c759', marginTop: 2 }}>→ {issue.fix}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Top Fixes */}
          <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 16 }}>🔧 Priority Fixes</div>
            {(result.topFixes || []).map((fix, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < result.topFixes.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1, padding: '3px 8px', borderRadius: 3, flexShrink: 0, background: fix.priority === 'high' ? '#fce4ec' : fix.priority === 'med' ? '#fffde7' : '#e8f5e9', color: fix.priority === 'high' ? '#c62828' : fix.priority === 'med' ? '#f57f17' : '#2e7d32', textTransform: 'uppercase' }}>{fix.priority}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 4 }}>{fix.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6e6e73', lineHeight: 1.6, marginBottom: fix.suggestion ? 6 : 0 }}>{fix.description}</div>
                  {fix.suggestion && <div style={{ background: '#f5f5f7', borderRadius: 4, padding: '8px 12px', fontSize: '0.78rem', fontStyle: 'italic', color: '#1d1d1f', borderLeft: '3px solid #c9a84c' }}>"{fix.suggestion}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
