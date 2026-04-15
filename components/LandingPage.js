'use client';

const PLATFORMS = [
  { name: 'Airbnb', icon: '🏠', limit: 50, color: '#ff5a5f', pct: 84 },
  { name: 'VRBO', icon: '🌴', limit: 75, color: '#1a5be0', pct: 74 },
  { name: 'Booking.com', icon: '🔵', limit: 60, color: '#003b95', pct: 70 },
  { name: 'TripAdvisor', icon: '🦉', limit: 80, color: '#00aa6c', pct: 77 },
  { name: 'Google VR', icon: '🔍', limit: 100, color: '#4285f4', pct: 82 },
  { name: 'Hipcamp', icon: '🏕️', limit: 60, color: '#5a8a62', pct: 62 },
];

const FEATURES = [
  { icon: '📰', title: 'OTA Headlines', desc: '10 headline variations per platform, all within exact character limits' },
  { icon: '📝', title: 'OTA Descriptions', desc: 'Full listing body copy per platform, tone-matched and conversion-optimized' },
  { icon: '📸', title: 'Photo Descriptions', desc: 'Room-by-room captions pulled from real listing photos' },
  { icon: '💰', title: 'Pricing Intelligence', desc: 'Market rates, seasonal multipliers, weekend premiums and competitor benchmarks' },
  { icon: '📋', title: 'House Rules & FAQ', desc: 'Auto-generated rules, check-in policies and guest FAQ' },
  { icon: '🔍', title: 'SEO & Keywords', desc: 'Primary, long-tail and local keywords plus meta tags' },
  { icon: '📊', title: 'Market Intel', desc: 'Competitor rates by bedroom, seasonal strategy and occasion pricing' },
  { icon: '🩺', title: 'Listing Auditor', desc: 'Health score out of 100 with ranked fix suggestions' },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 48px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          VR365 <span style={{ color: '#c9a84c' }}>Listing AI</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Features', 'Before & After', 'Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' & ', '-').replace(' ', '-')}`}
              style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
              {l}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '7px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}>
            See Pricing
          </button>
          <button onClick={() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '7px 16px', borderRadius: 20, background: '#c9a84c', color: '#000', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.12) 0%, transparent 70%), #000',
      }}>
        <div style={{
          display: 'inline-block', fontSize: '0.72rem', fontWeight: 600,
          letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c',
          marginBottom: 28, padding: '5px 14px', borderRadius: 20,
          border: '1px solid rgba(201,168,76,0.3)', background: 'rgba(201,168,76,0.08)',
        }}>AI-Powered Property Marketing</div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 7rem)', fontWeight: 800,
          lineHeight: 1.03, letterSpacing: '-0.04em', marginBottom: 28,
          background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Your listing.<br />Every platform.<br />
          <span style={{
            background: 'linear-gradient(135deg, #c9a84c 0%, #f0c040 50%, #c9a84c 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>60 seconds.</span>
        </h1>

        <p style={{ fontSize: '1.1rem', fontWeight: 300, color: 'rgba(255,255,255,0.55)', maxWidth: 620, lineHeight: 1.7, marginBottom: 44 }}>
          Paste any property URL. VR365 scrapes the real listing data, scans nearby locations,
          and generates perfectly optimized copy for every major OTA — all within exact character limits.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 64 }}>
          <button onClick={() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '16px 36px', background: 'white', color: 'black', border: 'none', borderRadius: 980, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
            Try It Free
          </button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ padding: '16px 36px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 980, fontSize: '1rem', cursor: 'pointer' }}>
            View Pricing →
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
          {[['4–5 days', 'saved per listing'], ['18 OTAs', 'written simultaneously'], ['100%', 'char-limit compliant'], ['$0', 'copywriter fees']].map(([num, label], i) => (
            <div key={i} style={{ padding: '20px 32px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'white' }}>{num}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORMS */}
      <section style={{ background: '#000', padding: '120px 48px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16 }}>Platform Intelligence</div>
          <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 16,
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Every platform. Every limit.<br />Always perfect.
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto 64px', lineHeight: 1.7 }}>
            VR365 knows the exact character limits for all 18 OTA platforms and enforces them automatically. No more truncated headlines.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            {PLATFORMS.map(p => (
              <div key={p.name} style={{ background: '#111', padding: '32px 28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '1.8rem' }}>{p.icon}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '0.5px solid rgba(201,168,76,0.3)' }}>
                    {p.limit} chars max
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{p.name}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34c759' }}>{Math.round(p.limit * p.pct / 100)}/{p.limit} ✓</div>
              </div>
            ))}
          </div>
          {/* More platforms */}
          <div style={{ marginTop: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 1 }}>+ 12 MORE:</span>
            {['Expedia', 'Hotels.com', 'Agoda', 'Kayak', 'Marriott', 'Plum Guide', 'Houfy', 'Vacasa', 'Evolve', 'Furnished Finder', 'Glamping Hub', "Misterb&b"].map(p => (
              <span key={p} style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '0.5px solid rgba(255,255,255,0.08)' }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section id="before-after" style={{ background: '#f5f5f7', padding: '120px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16 }}>Before & After</div>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: '#1d1d1f' }}>
            The old way was<br />costing you everything.
          </h2>
          <p style={{ fontSize: '1rem', color: '#6e6e73', marginBottom: 56, maxWidth: 520, lineHeight: 1.7 }}>
            4–5 days per property. $200–500 in copywriter fees. Listings going live late, inconsistent, never optimized.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { title: '❌ Without VR365', bg: '#f0eee9', items: [
                '4–5 days writing per property manually',
                'Different copy for each platform from scratch',
                'Headlines accidentally over character limits',
                'Generic copy with no location keywords',
                'No photo descriptions — guests can\'t visualize',
                '$200–500 per listing in copywriter fees',
                'No SEO — listing buried in search',
                'Scale to 150 homes? Impossible',
              ], good: false },
              { title: '✅ With VR365 Listing AI', bg: '#000', items: [
                'Full listing package ready in 60 seconds',
                'All 18 OTAs written simultaneously',
                'Guaranteed within every platform\'s limits',
                'AI scans nearby landmarks for every headline',
                'Professional room-by-room photo descriptions',
                '$99/month unlimited — not $200–500 per listing',
                'Full SEO keywords, meta tags, search strategy',
                'Scale to 500 properties without extra staff',
              ], good: true },
            ].map(col => (
              <div key={col.title} style={{ borderRadius: 20, overflow: 'hidden', border: col.good ? '2px solid #c9a84c' : '1px solid #e0ddd8' }}>
                <div style={{ padding: '18px 24px', background: col.bg, color: col.good ? 'white' : '#6e6e73', fontWeight: 700, fontSize: '0.92rem' }}>{col.title}</div>
                <div style={{ background: col.good ? '#0a0a0a' : '#fafaf8', padding: '8px 0' }}>
                  {col.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 24px', borderBottom: '0.5px solid rgba(0,0,0,0.05)', fontSize: '0.875rem', color: col.good ? 'rgba(255,255,255,0.8)' : '#86868b', alignItems: 'flex-start' }}>
                      <span style={{ color: col.good ? '#34c759' : '#ff3b30', flexShrink: 0 }}>{col.good ? '✓' : '✗'}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#000', padding: '120px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16 }}>Everything included</div>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16,
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            One tool.<br />Every piece of content.
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', marginBottom: 64, maxWidth: 480, lineHeight: 1.7 }}>
            Stop stitching together 6 different tools. VR365 covers everything a listing needs.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#111', padding: '32px 24px' }}>
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#000', padding: '120px 48px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 16 }}>Simple pricing</div>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16,
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            One price.<br />Unlimited properties.
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', marginBottom: 64, lineHeight: 1.7 }}>
            No per-property fees. No seat limits. Pays for itself on the very first listing.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 16, marginBottom: 32, textAlign: 'left' }}>
            {[
              { plan: 'Free', price: '0', tagline: 'Try VR365 with no commitment.', features: ['3 listings per month', 'Airbnb + VRBO only', 'Basic photo descriptions', '1 listing audit/month'], off: ['All 18 OTA platforms', 'Pricing intelligence', 'SEO & keywords', 'House rules & FAQ', 'Market Intel'], popular: false },
              { plan: 'Pro', price: '99', tagline: 'Everything. Unlimited properties. No contracts.', features: ['Unlimited listings', 'All 18 OTA platforms', '10 headlines per platform', 'Full photo descriptions', 'Pricing intelligence', 'SEO & keywords', 'House rules & FAQ', 'Market Intel + Auditor', 'Version history + PDF export', 'Priority support'], off: [], popular: true },
            ].map(tier => (
              <div key={tier.plan} style={{
                background: tier.popular ? 'linear-gradient(145deg, #1a1506 0%, #111 60%)' : '#111',
                border: tier.popular ? '2px solid rgba(201,168,76,0.5)' : '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: 40, position: 'relative',
                boxShadow: tier.popular ? '0 20px 60px rgba(201,168,76,0.1)' : 'none',
              }}>
                {tier.popular && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#c9a84c', color: '#000', fontSize: '0.65rem', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', padding: '5px 16px', borderRadius: 980, whiteSpace: 'nowrap' }}>
                    ⚡ Most Popular
                  </div>
                )}
                <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{tier.plan}</div>
                <div style={{ fontSize: '4.5rem', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: 'white', marginBottom: 4 }}>
                  <sup style={{ fontSize: '1.5rem', fontWeight: 600, verticalAlign: 'super' }}>$</sup>{tier.price}
                  <sub style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mo</sub>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: 28, paddingBottom: 28, borderBottom: '0.5px solid rgba(255,255,255,0.1)', lineHeight: 1.6 }}>{tier.tagline}</div>
                <div style={{ marginBottom: 28 }}>
                  {tier.features.map(f => <div key={f} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}><span style={{ color: '#34c759' }}>✓</span>{f}</div>)}
                  {tier.off.map(f => <div key={f} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}><span>✗</span>{f}</div>)}
                </div>
                <button
                  onClick={() => document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ width: '100%', padding: 15, borderRadius: 980, border: 'none', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', background: tier.popular ? '#c9a84c' : 'white', color: '#000' }}>
                  {tier.popular ? 'Get Pro — $99/mo →' : 'Start for Free'}
                </button>
                {tier.popular && <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>Cancel anytime · No contracts</div>}
              </div>
            ))}
          </div>
          {/* Math */}
          <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, textAlign: 'left' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'white', marginBottom: 8 }}>💡 The math is undeniable</div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                10 properties × $200 copywriter = <strong style={{ color: 'white' }}>$2,000</strong> vs <strong style={{ color: '#c9a84c' }}>$99/month unlimited.</strong> VR365 pays for itself on listing #1.
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c9a84c', letterSpacing: '-0.04em' }}>20×</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>cheaper than a copywriter</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
