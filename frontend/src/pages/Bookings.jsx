import { useEffect, useState } from 'react'
import { api } from '../utils/api'

const STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']
const PAY_STATUSES = ['Pending', 'Paid', 'Refunded']
const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Club', 'Private Party', 'Festival', 'Other']

const statusColor = s => ({ Completed: 'badge-green', Pending: 'badge-gold', Cancelled: 'badge-red', Confirmed: 'badge-blue', 'In Progress': 'badge-purple' }[s] || 'badge-gray')
const payColor = s => ({ Paid: 'badge-green', Pending: 'badge-gold', Refunded: 'badge-orange' }[s] || 'badge-gray')

function BookingModal({ booking, onClose, onSave }) {
  const [tab, setTab] = useState('status')
  const [status, setStatus] = useState(booking.status)
  const [pay, setPay] = useState({ paymentStatus: booking.paymentStatus, paymentMethod: booking.paymentMethod || '', transactionId: booking.transactionId || '' })
  const [details, setDetails] = useState({ eventType: booking.eventType, eventDate: booking.eventDate?.split('T')[0] || '', startTime: booking.startTime || '', endTime: booking.endTime || '', guestCount: booking.guestCount || '', specialRequests: booking.specialRequests || '', totalAmount: booking.totalAmount, eventCity: booking.eventCity || '', eventState: booking.eventState || '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const saveStatus = async () => {
    setLoading(true); setErr(''); setMsg('')
    const res = await api.updateBookingStatus(booking.id, status)
    if (res.success) { setMsg('Status updated!'); onSave({ ...booking, status }) }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  const savePay = async () => {
    setLoading(true); setErr(''); setMsg('')
    const res = await api.updateBookingPayment(booking.id, pay)
    if (res.success) { setMsg('Payment updated!'); onSave({ ...booking, ...pay }) }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  const saveDetails = async () => {
    setLoading(true); setErr(''); setMsg('')
    const res = await api.updateBooking(booking.id, details)
    if (res.success) { setMsg('Details updated!'); onSave({ ...booking, ...details }) }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg animate-in">
        <h3>Booking #{booking.id}</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, padding: '12px 16px', background: 'var(--raised)', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text2)' }}>User: <b style={{ color: 'var(--text)' }}>{booking.user?.firstName} {booking.user?.lastName}</b></span>
          <span style={{ color: 'var(--text2)' }}>DJ: <b style={{ color: 'var(--text)' }}>{booking.dj?.name || '—'}</b></span>
          <span style={{ color: 'var(--text2)' }}>Amount: <b style={{ color: 'var(--gold)' }}>₹{booking.totalAmount}</b></span>
        </div>

        <div className="tabs" style={{ marginBottom: 20 }}>
          {['status', 'payment', 'details'].map(t => (
            <button key={t} className={'tab-btn ' + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        {tab === 'status' && (
          <>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Booking Status</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {STATUSES.map(s => (
                <button key={s} className={'btn btn-sm ' + (status === s ? 'btn-primary' : 'btn-ghost')} onClick={() => setStatus(s)}>{s}</button>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveStatus} disabled={loading}>{loading ? 'Saving...' : 'Update Status'}</button>
            </div>
          </>
        )}

        {tab === 'payment' && (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label>Payment Status</label>
                <select className="input" value={pay.paymentStatus} onChange={e => setPay({ ...pay, paymentStatus: e.target.value })}>
                  {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Payment Method</label><input className="input" placeholder="UPI, Card, Cash..." value={pay.paymentMethod} onChange={e => setPay({ ...pay, paymentMethod: e.target.value })} /></div>
            </div>
            <div className="form-group" style={{ marginTop: 4 }}><label>Transaction ID</label><input className="input" placeholder="TXN123..." value={pay.transactionId} onChange={e => setPay({ ...pay, transactionId: e.target.value })} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={savePay} disabled={loading}>{loading ? 'Saving...' : 'Update Payment'}</button>
            </div>
          </>
        )}

        {tab === 'details' && (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label>Event Type</label>
                <select className="input" value={details.eventType} onChange={e => setDetails({ ...details, eventType: e.target.value })}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Event Date</label><input className="input" type="date" value={details.eventDate} onChange={e => setDetails({ ...details, eventDate: e.target.value })} /></div>
              <div className="form-group"><label>Start Time</label><input className="input" value={details.startTime} onChange={e => setDetails({ ...details, startTime: e.target.value })} placeholder="18:00" /></div>
              <div className="form-group"><label>End Time</label><input className="input" value={details.endTime} onChange={e => setDetails({ ...details, endTime: e.target.value })} placeholder="23:00" /></div>
              <div className="form-group"><label>Guest Count</label><input className="input" type="number" value={details.guestCount} onChange={e => setDetails({ ...details, guestCount: e.target.value })} /></div>
              <div className="form-group"><label>Total Amount</label><input className="input" type="number" value={details.totalAmount} onChange={e => setDetails({ ...details, totalAmount: e.target.value })} /></div>
              <div className="form-group"><label>City</label><input className="input" value={details.eventCity} onChange={e => setDetails({ ...details, eventCity: e.target.value })} /></div>
              <div className="form-group"><label>State</label><input className="input" value={details.eventState} onChange={e => setDetails({ ...details, eventState: e.target.value })} /></div>
            </div>
            <div className="form-group" style={{ marginTop: 4 }}><label>Special Requests</label><textarea className="input" value={details.specialRequests} onChange={e => setDetails({ ...details, specialRequests: e.target.value })} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveDetails} disabled={loading}>{loading ? 'Saving...' : 'Update Details'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editBooking, setEditBooking] = useState(null)
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  const fetchBookings = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: p, limit: 15 })
    if (statusFilter) params.set('status', statusFilter)
    if (month) params.set('month', month)
    if (year) params.set('year', year)
    const res = await api.getBookings('?' + params)
    if (res.success) { setBookings(res.data); setTotalPages(res.totalPages || 1) }
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [page, statusFilter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking?')) return
    const res = await api.deleteBooking(id)
    if (res.success) setBookings(bookings.filter(b => b.id !== id))
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div className="page-header-left"><h2>Bookings</h2><p>Full CRUD — manage all platform bookings</p></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...STATUSES].map(s => (
            <button key={s} className={'btn btn-sm ' + (statusFilter === s ? 'btn-primary' : 'btn-ghost')} onClick={() => { setStatusFilter(s); setPage(1) }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <select className="input" style={{ width: 130 }} value={month} onChange={e => setMonth(e.target.value)}>
          <option value="">All months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
            <option key={i} value={i+1}>{m}</option>
          ))}
        </select>
        <select className="input" style={{ width: 110 }} value={year} onChange={e => setYear(e.target.value)}>
          <option value="">All years</option>
          {[currentYear, currentYear-1, currentYear-2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); fetchBookings(1) }}>Filter</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setMonth(''); setYear(''); setStatusFilter(''); setPage(1) }}>Clear</button>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>User</th><th>DJ</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
              <tbody>
                {bookings.length === 0
                  ? <tr><td colSpan={9}><div className="empty"><p>No bookings found</p></div></td></tr>
                  : bookings.map(b => (
                    <tr key={b.id}>
                      <td className="mono" style={{ color: 'var(--text3)' }}>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.user?.firstName} {b.user?.lastName}</div>
                        <div className="mono">{b.user?.phone}</div>
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{b.dj?.name || '—'}</td>
                      <td>
                        <div>{b.eventType}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.eventCity || '—'}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{b.eventDate ? new Date(b.eventDate).toLocaleDateString() : '—'}</td>
                      <td style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{b.totalAmount}</td>
                      <td><span className={'badge ' + statusColor(b.status)}>{b.status}</span></td>
                      <td><span className={'badge ' + payColor(b.paymentStatus)}>{b.paymentStatus}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditBooking(b)}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDelete(b.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      {editBooking && <BookingModal booking={editBooking} onClose={() => setEditBooking(null)} onSave={updated => { setBookings(bookings.map(b => b.id === updated.id ? updated : b)); setEditBooking(null) }} />}
    </div>
  )
}
