import { useState, useEffect } from "react";
import { api } from "../api.js";
import { StatCard } from "./Shared.jsx";
import { lbl, inp, btnS } from "../styles.js";

const PRIMARY = "#1e1b4b";
const ACCENT  = "#6366f1";

// ─── helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function StatusBadge({ status }) {
  const active = status === 'active';
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: active ? '#dcfce7' : '#fef2f2', color: active ? '#16a34a' : '#dc2626' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Schools list ─────────────────────────────────────────────────────────────
function SchoolsList({ schools, onToggle }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 18, color: PRIMARY }}>All Schools</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['School','ID','Students','Staff','Parents','Status','Portal'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b',
                  fontWeight: 700, fontSize: 11, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map((s, i) => (
              <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg,${s.primaryColor},${s.primaryColor}99)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 900, fontSize: 11 }}>
                      {s.name.split(' ').map(w => w[0]).join('').slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.name}</div>
                      {s.motto && <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{s.motto}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontFamily: 'monospace' }}>{s.id}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: ACCENT }}>{s.studentCount ?? '—'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{s.staffCount ?? '—'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{s.parentCount ?? '—'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <StatusBadge status={s.status} />
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`/?school=${s.id}`} target="_blank" rel="noreferrer"
                      style={{ ...btnS(ACCENT), textDecoration: 'none', fontSize: 11, padding: '5px 12px' }}>
                      Open ↗
                    </a>
                    <button onClick={() => onToggle(s)}
                      style={{ ...btnS(s.status === 'active' ? '#ef4444' : '#22c55e'), fontSize: 11, padding: '5px 10px' }}>
                      {s.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!schools.length && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No schools yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Register school form ──────────────────────────────────────────────────────
function RegisterSchool({ onCreated }) {
  const [form, setForm] = useState({
    name: '', id: '', motto: '', primaryColor: '#4a1a7a',
    adminName: '', adminEmail: '', adminPin: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');
  const [success, setSuccess] = useState(null);

  function set(k, v) {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if (k === 'name') updated.id = slugify(v);
      return updated;
    });
    setErr('');
  }

  async function submit() {
    if (!form.name || !form.id || !form.adminEmail || !form.adminPin) {
      setErr('School name, ID, admin email and PIN are all required.'); return;
    }
    if (!/^\d{4,6}$/.test(form.adminPin)) {
      setErr('Admin PIN must be 4–6 digits.'); return;
    }
    setSaving(true);
    try {
      const result = await api.superRegister(form);
      setSuccess(result);
      setForm({ name: '', id: '', motto: '', primaryColor: '#4a1a7a', adminName: '', adminEmail: '', adminPin: '' });
      onCreated(result.school);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input value={form[key]} onChange={e => set(key, e.target.value)}
        style={inp} {...opts} />
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 18, color: PRIMARY }}>Register New School</h2>

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: 6 }}>✓ School created successfully</div>
          <div style={{ fontSize: 13, color: '#166534' }}>
            <strong>{success.school.name}</strong> is live at <code>?school={success.school.id}</code>
          </div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 6 }}>
            Admin login: <strong>{success.adminUser.email}</strong> / PIN: <strong>{success.adminUser.pin}</strong>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>{field('School Name *', 'name', { placeholder: 'e.g. Westlands Academy' })}</div>
        <div>
          <label style={lbl}>School ID (slug) *</label>
          <input value={form.id} onChange={e => set('id', slugify(e.target.value))}
            style={{ ...inp, fontFamily: 'monospace' }} placeholder="e.g. westlands" />
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Auto-generated · must be unique</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Primary Colour</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
              style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
            <input value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace', flex: 1 }} placeholder="#4a1a7a" />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>{field('School Motto', 'motto', { placeholder: 'e.g. Excellence in All Things' })}</div>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: 14, marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>INITIAL ADMIN ACCOUNT</div>
        </div>
        <div>{field('Admin Full Name', 'adminName', { placeholder: 'e.g. Mary Njoroge' })}</div>
        <div>{field('Admin Email *', 'adminEmail', { placeholder: 'admin@school.ac.ke', type: 'email' })}</div>
        <div>{field('Admin PIN * (4–6 digits)', 'adminPin', { placeholder: '0000', maxLength: 6 })}</div>
      </div>

      {err && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{err}</div>}

      <button onClick={submit} disabled={saving}
        style={{ ...btnS(ACCENT), padding: '10px 28px', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Creating…' : '＋ Register School'}
      </button>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function SuperAdminApp({ user, onLogout }) {
  const [tab, setTab]         = useState('schools');
  const [schools, setSchools] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([api.superSchools(), api.superStats()]);
      setSchools(s);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(school) {
    const next = school.status === 'active' ? 'inactive' : 'active';
    await api.superUpdateSchool(school.id, { status: next });
    setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: next } : s));
  }

  function handleCreated(school) {
    setSchools(prev => [...prev, school]);
    setStats(prev => prev ? { ...prev, schools: prev.schools + 1 } : prev);
    setTab('schools');
  }

  const navBtn = (id, label) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: '8px 20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
      background: tab === id ? ACCENT : 'transparent',
      color: tab === id ? 'white' : 'rgba(255,255,255,0.7)',
      borderRadius: 8,
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* ── Header ── */}
      <div style={{ background: PRIMARY, padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', minHeight: 56, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: 'white', fontSize: 14 }}>B</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>BPS — Super Admin</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Multi-school management</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {navBtn('schools', '🏫 Schools')}
          {navBtn('register', '＋ Register School')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{user.name}</span>
          <button onClick={onLogout} style={{ ...btnS('#374151'), fontSize: 12, padding: '6px 14px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, padding: '20px 24px 0' }}>
          <StatCard icon="🏫" label="Schools" value={stats.schools} col={ACCENT} />
          <StatCard icon="👥" label="Total Students" value={stats.students} col="#0d9488" />
          <StatCard icon="👤" label="Total Users" value={stats.users} col="#7c3aed" />
        </div>
      )}

      {/* ── Main ── */}
      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading…</div>
        ) : tab === 'schools' ? (
          <SchoolsList schools={schools} onToggle={handleToggle} />
        ) : (
          <RegisterSchool onCreated={handleCreated} />
        )}
      </div>
    </div>
  );
}
