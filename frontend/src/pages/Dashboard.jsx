import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'

const statusColor = s => ({
  Completed: 'badge-green', Pending: 'badge-gold',
  Cancelled: 'badge-red', Confirmed: 'badge-blue', 'In Progress': 'badge-purple'
}[s] || 'badge-gray')

const DONUT_COLORS = ['#1a97f5', '#13deb9', '#ffae1f', '#f9464e']
const GRAD_COLORS  = ['#1a97f5', '#13deb9', '#ffae1f', '#f9464e', '#763ee7']

// ─── Chart tooltip ───────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8edf2', borderRadius: 10,
      padding: '10px 14px', fontSize: 12, boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
      fontFamily: 'var(--font-body)',
    }}>
      <p style={{ color: '#5a6a85', marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} style={{ color: e.color || '#1a97f5', fontWeight: 600 }}>
          {e.name}: {e.value}
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, chip, chipUp, icon, iconBg, spark }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8edf2', borderRadius: 16,
      padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Icon badge */}
      <div style={{
        width: 54, height: 54, borderRadius: 14, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#5a6a85', fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <div style={{
          fontSize: 30, fontWeight: 800, color: '#2a3547',
          lineHeight: 1, marginBottom: 7, fontFamily: 'var(--font-display)',
        }}>
          {value ?? '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            background: chipUp ? '#e5fdf8' : '#fde8e9',
            color: chipUp ? '#05b79f' : '#f9464e',
            borderRadius: 20, padding: '2px 9px',
            fontWeight: 700, fontSize: 11,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            {chipUp ? '▲' : '▼'} {chip}
          </span>
          <span style={{ color: '#a3b4c6', fontSize: 11 }}>last 7 days</span>
        </div>
      </div>

      {/* Sparkline */}
      {spark?.length > 1 && (
        <div style={{ width: 70, height: 38, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark}>
              <Line type="monotone" dataKey="v"
                stroke={chipUp !== false ? '#1a97f5' : '#f9464e'}
                strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Welcome banner ───────────────────────────────────────────────────────────
function WelcomeBanner({ admin, stats }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a97f5 0%, #0c72c0 100%)',
      borderRadius: 18, padding: '26px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 24, overflow: 'hidden', position: 'relative',
      boxShadow: '0 8px 28px rgba(26,151,245,0.28)',
    }}>
      <div style={{ position: 'absolute', right: 230, top: -55, width: 190, height: 190, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 150, bottom: -44, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

      <div style={{ zIndex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
          BASSWALA ADMIN
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
          Welcome back, {admin?.firstName || 'Admin'}! 👋
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', marginBottom: 20 }}>
          Here's what's happening on your platform today.
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Bookings This Month', val: stats?.bookingsThisMonth ?? 0, icon: '📋' },
            { label: 'Active DJs',          val: stats?.activeDJs ?? 0,          icon: '🎧' },
            { label: 'Pending',             val: stats?.pendingBookings ?? 0,    icon: '⏳' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{item.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 86, lineHeight: 1, userSelect: 'none', zIndex: 1, filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.18))' }}>🎵</div>
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8edf2',
      borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

function CardHead({ title, sub, right }) {
  return (
    <div style={{ padding: '18px 22px', borderBottom: '1px solid #f0f4f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2a3547', fontFamily: 'var(--font-display)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#a3b4c6', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { admin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(r => { if (r.success) setData(r.data); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 14 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 38, height: 38, border: '3px solid #e8edf2', borderTopColor: '#1a97f5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#5a6a85', fontSize: 13 }}>Loading dashboard…</p>
    </div>
  )

  if (!data) return (
    <div style={{ background: '#fde8e9', border: '1px solid #fbb', borderRadius: 10, padding: '14px 18px', color: '#f9464e', fontSize: 13 }}>
      Failed to load dashboard. Is the backend running?
    </div>
  )

  const { stats, monthlyStats, recentBookings, recentUsers } = data

  const spark = (monthlyStats || []).slice(-7).map(m => ({ v: m.bookings || 0 }))
  const donutData = [
    { name: 'Completed', value: stats.completedBookings || 0 },
    { name: 'Confirmed', value: stats.confirmedBookings || 0 },
    { name: 'Pending',   value: stats.pendingBookings   || 0 },
    { name: 'Cancelled', value: stats.cancelledBookings || 0 },
  ].filter(d => d.value > 0)

  const ViewAll = ({ href }) => (
    <a href={href} style={{ fontSize: 12, color: '#1a97f5', fontWeight: 600, textDecoration: 'none' }}>View All →</a>
  )

  return (
    <div style={{ fontFamily: 'var(--font-body)', animation: 'fadeUp 0.3s ease' }}>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>

      <WelcomeBanner admin={admin} stats={stats} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
        <KpiCard label="Total Users"    value={stats.totalUsers}    chip={`+${stats.newUsersThisWeek ?? 0}`}         chipUp  icon="👥" iconBg="#eaf3ff" spark={spark} />
        <KpiCard label="Total DJs"      value={stats.totalDJs}      chip={`${stats.activeDJs ?? 0} active`}          chipUp  icon="🎧" iconBg="#e5fdf8" spark={spark} />
        <KpiCard label="Total Bookings" value={stats.totalBookings} chip={`${stats.bookingsThisMonth ?? 0} this month`} chipUp icon="📋" iconBg="#fef5e5" spark={spark} />
        <KpiCard label="Pending"        value={stats.pendingBookings} chip={`${stats.confirmedBookings ?? 0} confirmed`} chipUp={false} icon="⏳" iconBg="#fde8e9" spark={spark} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: 20, marginBottom: 20 }}>

        <Card>
          <CardHead
            title="Booking Trends"
            sub="Monthly booking activity — last 6 months"
            right={<span style={{ background: '#e5fdf8', color: '#05b79f', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>6 Months</span>}
          />
          <div style={{ padding: '12px 8px 16px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyStats} margin={{ left: 0, right: 10 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1a97f5" stopOpacity={0.14}/>
                    <stop offset="95%" stopColor="#1a97f5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#a3b4c6', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#a3b4c6', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="bookings" name="Bookings"
                  stroke="#1a97f5" strokeWidth={2.5} fill="url(#grad1)"
                  dot={{ fill: '#1a97f5', r: 3.5, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#1a97f5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2a3547', fontFamily: 'var(--font-display)', marginBottom: 2 }}>Booking Status</div>
          <div style={{ fontSize: 12, color: '#a3b4c6', marginBottom: 10 }}>Overall breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <PieChart width={148} height={148}>
              <Pie
                data={donutData.length ? donutData : [{ name: 'None', value: 1 }]}
                cx={70} cy={70} innerRadius={42} outerRadius={66}
                dataKey="value" strokeWidth={2} stroke="#fff"
              >
                {(donutData.length ? donutData : [{}]).map((_, i) => (
                  <Cell key={i} fill={donutData.length ? DONUT_COLORS[i % 4] : '#e8edf2'} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Completed', val: stats.completedBookings || 0, color: '#1a97f5' },
              { label: 'Confirmed', val: stats.confirmedBookings || 0, color: '#13deb9' },
              { label: 'Pending',   val: stats.pendingBookings   || 0, color: '#ffae1f' },
              { label: 'Cancelled', val: stats.cancelledBookings || 0, color: '#f9464e' },
            ].map(item => {
              const pct = stats.totalBookings ? Math.round(item.val / stats.totalBookings * 100) : 0
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#5a6a85', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2a3547', fontFamily: 'var(--font-display)' }}>{item.val}</span>
                  <div style={{ width: 54, height: 4, background: '#f0f4f9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: item.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#a3b4c6', width: 26, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Bookings table */}
        <Card>
          <CardHead title="Recent Bookings" sub="Latest booking activity" right={<ViewAll href="/bookings" />} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>DJ</th><th>Event</th><th>Status</th></tr></thead>
              <tbody>
                {!recentBookings?.length
                  ? <tr><td colSpan={4}><div className="empty"><p>No bookings yet</p></div></td></tr>
                  : recentBookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg,#1a97f5,#13deb9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                          }}>{b.user?.firstName?.[0]}{b.user?.lastName?.[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#2a3547' }}>{b.user?.firstName} {b.user?.lastName}</div>
                            <div style={{ fontSize: 11, color: '#a3b4c6' }}>{b.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#5a6a85', fontSize: 13 }}>{b.dj?.name || '—'}</td>
                      <td style={{ color: '#5a6a85', fontSize: 13 }}>{b.eventType || '—'}</td>
                      <td><span className={'badge ' + statusColor(b.status)}>{b.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Users list */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHead title="New Users" sub="Recently joined" right={<ViewAll href="/users" />} />
          <div style={{ flex: 1 }}>
            {recentUsers?.map((u, i) => (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 20px',
                  borderBottom: i < recentUsers.length - 1 ? '1px solid #f5f7fa' : 'none',
                  transition: 'background 0.12s', cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fbff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg,${GRAD_COLORS[i%5]},${GRAD_COLORS[(i+2)%5]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#2a3547' }}>{u.firstName} {u.lastName}</div>
                  <div style={{ fontSize: 11, color: '#a3b4c6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                <span className={'badge ' + (u.role === 'dj' ? 'badge-gold' : u.role === 'admin' ? 'badge-purple' : 'badge-blue')}>{u.role}</span>
              </div>
            ))}
          </div>
          <div style={{
            padding: '13px 20px', background: 'linear-gradient(135deg,#f6f9fc,#edf6ff)',
            borderTop: '1px solid #e8edf2',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: '#5a6a85' }}>Total registered</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#1a97f5', fontFamily: 'var(--font-display)' }}>{stats.totalUsers}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}