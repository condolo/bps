const SCHOOLS = [
  {
    id: 'saa',
    name: "St. Austin's Academy",
    motto: 'Dare to Be',
    desc: 'Staff, student and parent portal',
    color: '#4a1a7a',
    initials: 'SAA',
    badge: 'Live School',
    badgeColor: '#7c3aed',
  },
  {
    id: 'demo',
    name: 'Mascit Lab Academy',
    motto: 'Learn. Grow. Lead.',
    desc: 'Full demo — fictional students, all roles available',
    color: '#0f766e',
    initials: 'MLA',
    badge: 'Demo',
    badgeColor: '#0d9488',
  },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#1e1b4b,#312e81)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'system-ui,sans-serif',
    }}>
      {/* Logo mark */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg,#6366f1,#818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, color: 'white', fontSize: 20,
        }}>B</div>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
            Behaviour Point System
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            Select a school portal to continue
          </div>
        </div>
      </div>

      <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginBottom: 36 }} />

      {/* School cards */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 680 }}>
        {SCHOOLS.map(s => (
          <a key={s.id} href={`/?school=${s.id}`}
            style={{
              textDecoration: 'none', cursor: 'pointer',
              background: 'white', borderRadius: 18,
              padding: 28, width: 280, boxSizing: 'border-box',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* School avatar + badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg,${s.color},${s.color}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 15,
              }}>{s.initials}</div>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: s.badgeColor + '18', color: s.badgeColor,
              }}>{s.badge}</span>
            </div>

            {/* Info */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b', marginBottom: 3 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: s.color, fontStyle: 'italic', marginBottom: 6 }}>{s.motto}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{s.desc}</div>
            </div>

            {/* CTA */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10,
              background: s.color + '12', color: s.color, fontWeight: 700, fontSize: 13,
            }}>
              <span>Open Portal</span>
              <span style={{ fontSize: 16 }}>→</span>
            </div>
          </a>
        ))}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 36 }}>
        BPS · Powering School Behaviour · v3.1
      </div>
    </div>
  );
}
