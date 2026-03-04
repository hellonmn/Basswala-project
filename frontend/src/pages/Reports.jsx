import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'

const CT = (props) => {
  if (!props.active || !props.payload?.length) return null
  return (
    <div style={{ background: 'var(--raised)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text)' }}>
      <p style={{ color: 'var(--text2)', marginBottom: 4 }}>{props.label}</p>
      {props.payload.map((e, i) => <div key={i} style={{ color: e.color }}>{e.name}: <b>{e.value}</b></div>)}
    </div>
  )
}

export default function Reports() {
  const now = new Date()
  const [tab, setTab] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [yearOnly, setYearOnly] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [yearData, setYearData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchMonthly = async () => {
    setLoading(true)
    const res = await api.monthlyReport(month, year)
    if (res.success) setData(res.data)
    setLoading(false)
  }

  const fetchYearly = async () => {
    setLoading(true)
    const res = await api.yearlyReport(yearOnly)
    if (res.success) setYearData(res.data)
    setLoading(false)
  }

  useEffect(() => { if (tab === 'monthly') fetchMonthly(); else fetchYearly() }, [tab])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const currentYear = new Date().getFullYear()

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div className="page-header-left"><h2>Reports</h2><p>Monthly and yearly analytics</p></div>
      </div>

      <div className="tabs">
        <button className={'tab-btn ' + (tab === 'monthly' ? 'active' : '')} onClick={() => setTab('monthly')}>Monthly Report</button>
        <button className={'tab-btn ' + (tab === 'yearly' ? 'active' : '')} onClick={() => setTab('yearly')}>Yearly Report</button>
      </div>

      {tab === 'monthly' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <select className="input" style={{ width: 140 }} value={month} onChange={e => setMonth(e.target.value)}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="input" style={{ width: 110 }} value={year} onChange={e => setYear(e.target.value)}>
              {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchMonthly} disabled={loading}>{loading ? 'Loading...' : 'Generate Report'}</button>
          </div>

          {data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Bookings', val: data.stats.totalBookings, color: 'var(--glow)' },
                  { label: 'Completed', val: data.stats.completedBookings, color: 'var(--green)' },
                  { label: 'Cancelled', val: data.stats.cancelledBookings, color: 'var(--red)' },
                  { label: 'Pending', val: data.stats.pendingBookings, color: 'var(--gold)' },
                  { label: 'New Users', val: data.stats.newUsers, color: 'var(--blue)' },
                  { label: 'New DJs', val: data.stats.newDJs, color: 'var(--orange)' },
                ].map(item => (
                  <div key={item.label} className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{item.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Top DJs */}
                <div className="card">
                  <div className="card-header"><h3>Top DJs This Month</h3></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>DJ Name</th><th>City</th><th>Rating</th><th>Bookings</th></tr></thead>
                      <tbody>
                        {data.topDJs.length === 0
                          ? <tr><td colSpan={4}><div className="empty"><p>No data</p></div></td></tr>
                          : data.topDJs.map(t => (
                            <tr key={t.djId}>
                              <td style={{ fontWeight: 500 }}>{t.dj?.name || '—'}</td>
                              <td style={{ color: 'var(--text2)' }}>{t.dj?.locationCity || '—'}</td>
                              <td style={{ color: 'var(--gold)' }}>★ {t.dj?.ratingAverage || 0}</td>
                              <td><span className="badge badge-purple">{t.dataValues?.bookingCount || t.bookingCount}</span></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Event types */}
                <div className="card">
                  <div className="card-header"><h3>Event Types</h3></div>
                  <div className="card-body">
                    {data.topEventTypes.length === 0
                      ? <div className="empty"><p>No data</p></div>
                      : data.topEventTypes.map(e => {
                        const total = data.stats.totalBookings
                        const pct = total ? Math.round((e.dataValues?.count || e.count) / total * 100) : 0
                        return (
                          <div key={e.eventType} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, color: 'var(--text2)' }}>{e.eventType}</span>
                              <span style={{ fontSize: 12, color: 'var(--glow)', fontWeight: 600 }}>{e.dataValues?.count || e.count} ({pct}%)</span>
                            </div>
                            <div style={{ height: 4, background: 'var(--border2)', borderRadius: 2 }}>
                              <div style={{ width: pct + '%', height: '100%', background: 'var(--glow)', borderRadius: 2 }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>

              {/* All bookings table */}
              <div className="card">
                <div className="card-header"><h3>All Bookings — {months[parseInt(month)-1]} {year}</h3></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>User</th><th>DJ</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.bookings.length === 0
                        ? <tr><td colSpan={7}><div className="empty"><p>No bookings this month</p></div></td></tr>
                        : data.bookings.map(b => (
                          <tr key={b.id}>
                            <td className="mono" style={{ color: 'var(--text3)' }}>#{b.id}</td>
                            <td style={{ fontWeight: 500 }}>{b.user?.firstName} {b.user?.lastName}</td>
                            <td style={{ color: 'var(--text2)' }}>{b.dj?.name || '—'}</td>
                            <td>{b.eventType}</td>
                            <td style={{ fontSize: 12, color: 'var(--text2)' }}>{b.eventDate ? new Date(b.eventDate).toLocaleDateString() : '—'}</td>
                            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{b.totalAmount}</td>
                            <td><span className={'badge ' + ({ Completed: 'badge-green', Pending: 'badge-gold', Cancelled: 'badge-red', Confirmed: 'badge-blue', 'In Progress': 'badge-purple' }[b.status] || 'badge-gray')}>{b.status}</span></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'yearly' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
            <select className="input" style={{ width: 110 }} value={yearOnly} onChange={e => setYearOnly(e.target.value)}>
              {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-primary" onClick={fetchYearly} disabled={loading}>{loading ? 'Loading...' : 'Generate Report'}</button>
          </div>

          {yearData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div className="card">
                  <div className="card-header"><h3>Monthly Bookings — {yearData.year}</h3></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={yearData.monthlyBreakdown} barSize={22}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="monthName" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(0,3)} />
                        <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CT />} cursor={{ fill: 'rgba(124,111,255,0.06)' }} />
                        <Bar dataKey="totalBookings" name="Total" fill="var(--glow)" radius={[4,4,0,0]} />
                        <Bar dataKey="completedBookings" name="Completed" fill="var(--green)" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h3>New Users — {yearData.year}</h3></div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={yearData.monthlyBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="monthName" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v.slice(0,3)} />
                        <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CT />} cursor={{ stroke: 'var(--glow)', strokeWidth: 1 }} />
                        <Line type="monotone" dataKey="newUsers" name="New Users" stroke="var(--blue)" strokeWidth={2} dot={{ fill: 'var(--blue)', strokeWidth: 0, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Year Breakdown — {yearData.year}</h3></div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Month</th><th>Total Bookings</th><th>Completed</th><th>Cancelled</th><th>New Users</th></tr></thead>
                    <tbody>
                      {yearData.monthlyBreakdown.map(m => (
                        <tr key={m.month}>
                          <td style={{ fontWeight: 500 }}>{m.monthName}</td>
                          <td style={{ color: 'var(--glow)' }}>{m.totalBookings}</td>
                          <td style={{ color: 'var(--green)' }}>{m.completedBookings}</td>
                          <td style={{ color: 'var(--red)' }}>{m.cancelledBookings}</td>
                          <td style={{ color: 'var(--blue)' }}>{m.newUsers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
