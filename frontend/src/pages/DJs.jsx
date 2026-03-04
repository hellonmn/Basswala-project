import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GRAD_COLORS = ['#1a97f5', '#13deb9', '#ffae1f', '#f9464e', '#763ee7']

function parseGenres(g) {
  if (!g) return []
  if (Array.isArray(g)) return g
  if (typeof g === 'string' && g.startsWith('[')) {
    try { return JSON.parse(g) } catch {}
  }
  return typeof g === 'string' && g ? g.split(',').map(s => s.trim()).filter(Boolean) : []
}

// ─── DJ Modal ─────────────────────────────────────────────────────────────────
function DJModal({ dj, onClose, onSave }) {
  const isEdit = !!dj

  const toStr = (g) => {
    if (!g) return ''
    if (Array.isArray(g)) return g.join(', ')
    if (typeof g === 'string' && g.startsWith('[')) { try { return JSON.parse(g).join(', ') } catch {} }
    return g
  }

  const [tab, setTab]     = useState('info')
  const [form, setForm]   = useState(isEdit ? {
    name: dj.name, description: dj.description, hourlyRate: dj.hourlyRate,
    minimumHours: dj.minimumHours, currency: dj.currency || 'INR',
    locationCity: dj.locationCity || '', locationState: dj.locationState || '',
    locationCountry: dj.locationCountry || 'India',
    latitude: dj.latitude || '', longitude: dj.longitude || '',
    genres: toStr(dj.genres), isAvailable: dj.isAvailable,
    ratingAverage: dj.ratingAverage || 0, ratingCount: dj.ratingCount || 0,
  } : {
    name: '', description: '', hourlyRate: '', minimumHours: 2, currency: 'INR',
    locationCity: '', locationState: '', locationCountry: 'India',
    latitude: '', longitude: '', genres: '', isAvailable: true, userId: '',
  })
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [msg,     setMsg]     = useState('')

  const save = async () => {
    setLoading(true); setErr(''); setMsg('')
    const payload = {
      ...form,
      hourlyRate: parseFloat(form.hourlyRate),
      latitude:   parseFloat(form.latitude),
      longitude:  parseFloat(form.longitude),
      genres: form.genres.split(',').map(g => g.trim()).filter(Boolean),
    }
    const res = isEdit ? await api.updateDJ(dj.id, payload) : await api.createDJ(payload)
    if (res.success) { setMsg(isEdit ? 'DJ updated!' : 'DJ created!'); onSave(res.data) }
    else setErr(res.message || 'Error saving DJ')
    setLoading(false)
  }

  const f = field => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) })
  const tabs = isEdit ? ['info', 'location', 'ratings'] : ['info']

  const Lbl = ({ children }) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: '#5a6a85', marginBottom: 4, display: 'block', fontFamily: 'var(--font-body)' }}>
      {children}
    </label>
  )
  const Inp = (props) => (
    <input className="input" style={{ fontSize: 13, fontFamily: 'var(--font-body)' }} {...props} />
  )
  const Sel = (props) => (
    <select className="input" style={{ fontSize: 13, fontFamily: 'var(--font-body)' }} {...props} />
  )

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20, color: '#2a3547' }}>
          {isEdit ? `Edit DJ — ${dj.name}` : '+ Add New DJ'}
        </h3>

        {tabs.length > 1 && (
          <div style={{ display: 'flex', gap: 4, background: '#f6f9fc', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '7px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                textTransform: 'capitalize', transition: 'all 0.15s',
                background: tab === t ? '#1a97f5' : 'transparent',
                color: tab === t ? '#fff' : '#5a6a85',
              }}>{t}</button>
            ))}
          </div>
        )}

        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">✓ {msg}</div>}

        {(tab === 'info' || !isEdit) && (
          <>
            {!isEdit && (
              <div className="form-group" style={{ marginBottom: 14 }}>
                <Lbl>Assign to User ID (optional)</Lbl>
                <Inp placeholder="User ID to link this DJ profile to" {...f('userId')} />
              </div>
            )}
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group"><Lbl>DJ Name</Lbl><Inp placeholder="DJ Rahul" {...f('name')} /></div>
              <div className="form-group"><Lbl>Hourly Rate (INR)</Lbl><Inp type="number" placeholder="2000" {...f('hourlyRate')} /></div>
              <div className="form-group"><Lbl>Min Hours</Lbl><Inp type="number" {...f('minimumHours')} /></div>
              <div className="form-group"><Lbl>Currency</Lbl><Sel {...f('currency')}><option value="INR">INR</option><option value="USD">USD</option></Sel></div>
              {isEdit && (
                <div className="form-group">
                  <Lbl>Available</Lbl>
                  <Sel value={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.value === 'true' })}>
                    <option value="true">Yes</option><option value="false">No</option>
                  </Sel>
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <Lbl>Description</Lbl>
              <textarea className="input" rows={3} placeholder="Professional DJ with 5+ years..." {...f('description')} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <Lbl>Genres (comma separated)</Lbl>
              <Inp placeholder="Bollywood, EDM, Hip-Hop, Punjabi" {...f('genres')} />
            </div>
            {!isEdit && (
              <div className="form-grid">
                <div className="form-group"><Lbl>City</Lbl><Inp placeholder="Mumbai" {...f('locationCity')} /></div>
                <div className="form-group"><Lbl>State</Lbl><Inp placeholder="Maharashtra" {...f('locationState')} /></div>
                <div className="form-group"><Lbl>Latitude</Lbl><Inp type="number" step="any" placeholder="19.0760" {...f('latitude')} /></div>
                <div className="form-group"><Lbl>Longitude</Lbl><Inp type="number" step="any" placeholder="72.8777" {...f('longitude')} /></div>
              </div>
            )}
          </>
        )}

        {tab === 'location' && isEdit && (
          <div className="form-grid">
            <div className="form-group"><Lbl>City</Lbl><Inp {...f('locationCity')} /></div>
            <div className="form-group"><Lbl>State</Lbl><Inp {...f('locationState')} /></div>
            <div className="form-group"><Lbl>Country</Lbl><Inp {...f('locationCountry')} /></div>
            <div className="form-group"><Lbl>Latitude</Lbl><Inp type="number" step="any" {...f('latitude')} /></div>
            <div className="form-group"><Lbl>Longitude</Lbl><Inp type="number" step="any" {...f('longitude')} /></div>
          </div>
        )}

        {tab === 'ratings' && isEdit && (
          <div className="form-grid">
            <div className="form-group"><Lbl>Rating (0–5)</Lbl><Inp type="number" step="0.1" min="0" max="5" {...f('ratingAverage')} /></div>
            <div className="form-group"><Lbl>Rating Count</Lbl><Inp type="number" {...f('ratingCount')} /></div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create DJ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DJ Card ──────────────────────────────────────────────────────────────────
function DJCard({ d, onEdit, onToggle, onDelete, onView }) {
  const genres  = parseGenres(d.genres)
  const initials = d.name ? d.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'DJ'
  const idx = (d.id || 0) % GRAD_COLORS.length

  return (
    <div
      onClick={onView}
      style={{
        background: '#fff', border: '1px solid #e8edf2', borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,151,245,0.15)'
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.borderColor = '#1a97f5'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#e8edf2'
      }}
    >
      {/* Top */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: `linear-gradient(135deg, ${GRAD_COLORS[idx]}, ${GRAD_COLORS[(idx + 2) % 5]})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-display)',
            boxShadow: `0 4px 12px ${GRAD_COLORS[idx]}44`,
          }}>
            {initials}
          </div>
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 13, height: 13, borderRadius: '50%',
            background: d.isAvailable ? '#13deb9' : '#f9464e',
            border: '2px solid #fff',
          }} />
        </div>

        {/* Name / owner */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#2a3547', fontFamily: 'var(--font-display)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.name}
          </div>
          <div style={{ fontSize: 12, color: '#a3b4c6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.owner ? `${d.owner.firstName} ${d.owner.lastName}` : 'No owner assigned'}
          </div>
        </div>

        {/* Status pill */}
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 0.6, flexShrink: 0,
          background: d.isAvailable ? '#e5fdf8' : '#fde8e9',
          color: d.isAvailable ? '#05b79f' : '#f9464e',
          border: `1px solid ${d.isAvailable ? '#a8f0e5' : '#fbb'}`,
        }}>
          {d.isAvailable ? 'Live' : 'Off'}
        </span>
      </div>

      {/* Location */}
      {(d.locationCity || d.locationState) && (
        <div style={{ padding: '0 18px 10px', fontSize: 11, color: '#a3b4c6', display: 'flex', alignItems: 'center', gap: 4 }}>
          📍 {[d.locationCity, d.locationState].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Metrics */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid #f5f7fa', borderBottom: '1px solid #f5f7fa', display: 'flex', gap: 0 }}>
        {[
          { label: 'Rate / hr', val: `₹${(d.hourlyRate||0).toLocaleString()}`, color: '#1a97f5' },
          { label: 'Rating',    val: `★ ${d.ratingAverage || '0.0'}`,          color: '#ffae1f' },
          { label: 'Min Hours', val: `${d.minimumHours}h`,                     color: '#13deb9' },
        ].map((m, i) => (
          <div key={m.label} style={{
            flex: 1, textAlign: 'center', padding: '6px 0',
            borderRight: i < 2 ? '1px solid #f0f4f9' : 'none',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: m.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: '#a3b4c6', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div style={{ padding: '10px 18px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {genres.slice(0, 3).map(g => (
            <span key={g} style={{
              padding: '3px 10px', borderRadius: 20,
              background: '#eaf3ff', color: '#1a97f5',
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
              border: '1px solid #c5dfff',
            }}>{g}</span>
          ))}
          {genres.length > 3 && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f6f9fc', color: '#a3b4c6', fontSize: 10, fontWeight: 600 }}>
              +{genres.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid #f5f7fa',
        display: 'flex', gap: 6,
      }} onClick={e => e.stopPropagation()}>
        {[
          { label: 'Edit',   action: onEdit,   style: { background: '#f6f9fc', color: '#5a6a85', border: '1px solid #e8edf2' } },
          { label: 'View',   action: onView,   style: { background: '#eaf3ff', color: '#1a97f5', border: '1px solid #c5dfff' } },
          { label: d.isAvailable ? 'Disable' : 'Enable', action: onToggle,
            style: d.isAvailable
              ? { background: '#fde8e9', color: '#f9464e', border: '1px solid #fbb' }
              : { background: '#e5fdf8', color: '#05b79f', border: '1px solid #a8f0e5' },
          },
          { label: 'Delete', action: onDelete, style: { background: '#fde8e9', color: '#f9464e', border: '1px solid #fbb' } },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
              ...btn.style,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DJs() {
  const [djs,        setDJs]        = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('')
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [editDJ,     setEditDJ]     = useState(null)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total,      setTotal]      = useState(0)
  const navigate = useNavigate()

  const fetchDJs = useCallback(async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: p, limit: 12 })
    if (filter !== '') params.set('isAvailable', filter)
    if (search)        params.set('search', search)
    const res = await api.getDJs('?' + params)
    if (res.success) {
      setDJs(res.data)
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || res.data?.length || 0)
    }
    setLoading(false)
  }, [page, filter])

  useEffect(() => { fetchDJs() }, [page, filter])

  const handleToggle = async (id, e) => {
    e?.stopPropagation()
    const res = await api.toggleDJAvail(id)
    if (res.success) setDJs(prev => prev.map(d => d.id === id ? { ...d, isAvailable: !d.isAvailable } : d))
  }

  const handleDelete = async (id, e) => {
    e?.stopPropagation()
    if (!window.confirm('Delete this DJ and all related bookings?')) return
    const res = await api.deleteDJ(id)
    if (res.success) { setDJs(prev => prev.filter(d => d.id !== id)); setTotal(t => t - 1) }
  }

  const handleSave = (saved) => {
    if (editDJ) setDJs(prev => prev.map(d => d.id === saved.id ? saved : d))
    else { setDJs(prev => [saved, ...prev]); setTotal(t => t + 1) }
    setShowModal(false); setEditDJ(null)
  }

  const avail  = djs.filter(d =>  d.isAvailable).length
  const off    = djs.filter(d => !d.isAvailable).length
  const avgRate = djs.length ? Math.round(djs.reduce((s, d) => s + (d.hourlyRate || 0), 0) / djs.length) : 0

  const FILTERS = [
    { v: '',      label: 'All DJs' },
    { v: 'true',  label: 'Available' },
    { v: 'false', label: 'Offline' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-body)', animation: 'fadeUp 0.3s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#2a3547', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
          DJ Management
        </div>
        <div style={{ fontSize: 13, color: '#5a6a85' }}>
          Manage all DJ profiles, availability and bookings
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total DJs',    val: total,   icon: '🎧', bg: '#eaf3ff', col: '#1a97f5' },
          { label: 'Available',    val: avail,   icon: '✅', bg: '#e5fdf8', col: '#13deb9' },
          { label: 'Offline',      val: off,     icon: '⛔', bg: '#fde8e9', col: '#f9464e' },
          { label: 'Avg Rate/hr',  val: `₹${avgRate.toLocaleString()}`, icon: '💰', bg: '#fef5e5', col: '#ffae1f' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', border: '1px solid #e8edf2', borderRadius: 14,
            padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#a3b4c6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.col, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Welcome / hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a97f5 0%, #0c72c0 100%)',
        borderRadius: 16, padding: '22px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22, overflow: 'hidden', position: 'relative',
        boxShadow: '0 6px 24px rgba(26,151,245,0.25)',
      }}>
        <div style={{ position: 'absolute', right: 160, top: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            🎵 Book the Best DJs in Town
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            Perfect sound for every moment — manage, activate, and discover top talent
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 22px', background: '#fff', color: '#1a97f5',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', zIndex: 1, flexShrink: 0,
            fontFamily: 'var(--font-body)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          + Add New DJ
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a3b4c6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchDJs(1) } }}
            placeholder="Search DJs, genres, city…"
            style={{
              width: '100%', background: '#fff', border: '1px solid #e8edf2',
              borderRadius: 10, padding: '9px 14px 9px 36px',
              fontSize: 13, color: '#2a3547', outline: 'none',
              fontFamily: 'var(--font-body)',
              transition: 'border-color 0.15s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
            onFocus={e => e.target.style.borderColor = '#1a97f5'}
            onBlur={e => e.target.style.borderColor = '#e8edf2'}
          />
        </div>

        {/* Filter pills */}
        {FILTERS.map(({ v, label }) => (
          <button key={v} onClick={() => { setFilter(v); setPage(1) }} style={{
            padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
            background: filter === v ? '#1a97f5' : '#fff',
            color:      filter === v ? '#fff'    : '#5a6a85',
            border: filter === v ? '1px solid #1a97f5' : '1px solid #e8edf2',
            boxShadow: filter === v ? '0 4px 12px rgba(26,151,245,0.25)' : '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280, flexDirection: 'column', gap: 14 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: '3px solid #e8edf2', borderTopColor: '#1a97f5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#a3b4c6', fontSize: 13 }}>Loading DJs…</p>
        </div>
      ) : djs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.4 }}>🎧</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#5a6a85', fontFamily: 'var(--font-display)' }}>No DJs found</div>
          <div style={{ fontSize: 13, color: '#a3b4c6', marginTop: 4 }}>Try changing your filters or add a new DJ</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16, marginBottom: 24 }}>
          {djs.map(d => (
            <DJCard
              key={d.id}
              d={d}
              onView={()  => navigate(`/djs/${d.id}`)}
              onEdit={(e) => { e?.stopPropagation(); setEditDJ(d) }}
              onToggle={(e) => handleToggle(d.id, e)}
              onDelete={(e) => handleDelete(d.id, e)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: 13, color: '#5a6a85', fontFamily: 'var(--font-body)' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {/* ── Modal ── */}
      {(showModal || editDJ) && (
        <DJModal dj={editDJ} onClose={() => { setShowModal(false); setEditDJ(null) }} onSave={handleSave} />
      )}
    </div>
  )
}