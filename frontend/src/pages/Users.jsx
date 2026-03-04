import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

const roleBadge = r => ({ admin: 'badge-purple', dj: 'badge-gold', user: 'badge-blue' }[r] || 'badge-gray')

function EditUserModal({ user, onClose, onSave }) {
  const [tab, setTab] = useState('info')
  const [form, setForm] = useState({
    firstName: user.firstName, lastName: user.lastName, email: user.email,
    phone: user.phone, role: user.role, dateOfBirth: user.dateOfBirth || '',
    profilePicture: user.profilePicture || '', isVerified: user.isVerified, isActive: user.isActive,
    locationStreet: user.locationStreet || '', locationCity: user.locationCity || '',
    locationState: user.locationState || '', locationZipCode: user.locationZipCode || '',
    locationCountry: user.locationCountry || '', latitude: user.latitude || '', longitude: user.longitude || ''
  })
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = async () => {
    setLoading(true); setErr(''); setMsg('')
    const res = await api.updateUser(user.id, form)
    if (res.success) { setMsg('Saved!'); onSave(res.data) }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  const saveLocation = async () => {
    setLoading(true); setErr(''); setMsg('')
    const res = await api.updateUserLocation(user.id, {
      latitude: form.latitude, longitude: form.longitude,
      locationStreet: form.locationStreet, locationCity: form.locationCity,
      locationState: form.locationState, locationZipCode: form.locationZipCode,
      locationCountry: form.locationCountry
    })
    if (res.success) { setMsg('Location updated!'); onSave(res.data) }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  const resetPass = async () => {
    if (!newPass || newPass.length < 6) return setErr('Password must be 6+ characters')
    setLoading(true); setErr(''); setMsg('')
    const res = await api.resetUserPassword(user.id, newPass)
    if (res.success) { setMsg('Password reset successfully!'); setNewPass('') }
    else setErr(res.message || 'Error')
    setLoading(false)
  }

  const f = (field) => ({ value: form[field], onChange: e => setForm({ ...form, [field]: e.target.value }) })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg animate-in">
        <h3>Edit User — {user.firstName} {user.lastName}</h3>

        <div className="tabs" style={{ marginBottom: 20 }}>
          {['info', 'location', 'security', 'status'].map(t => (
            <button key={t} className={'tab-btn ' + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {err && <div className="alert alert-error">{err}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}

        {tab === 'info' && (
          <>
            <div className="form-grid">
              <div className="form-group"><label>First Name</label><input className="input" {...f('firstName')} /></div>
              <div className="form-group"><label>Last Name</label><input className="input" {...f('lastName')} /></div>
              <div className="form-group"><label>Email</label><input className="input" type="email" {...f('email')} /></div>
              <div className="form-group"><label>Phone</label><input className="input" {...f('phone')} /></div>
              <div className="form-group">
                <label>Role</label>
                <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option><option value="dj">DJ</option><option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group"><label>Date of Birth</label><input className="input" type="date" {...f('dateOfBirth')} /></div>
            </div>
            <div className="form-group" style={{ marginTop: 4 }}><label>Profile Picture URL</label><input className="input" {...f('profilePicture')} placeholder="https://..." /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Info'}</button>
            </div>
          </>
        )}

        {tab === 'location' && (
          <>
            <div className="form-grid">
              <div className="form-group"><label>Latitude</label><input className="input" type="number" step="any" {...f('latitude')} /></div>
              <div className="form-group"><label>Longitude</label><input className="input" type="number" step="any" {...f('longitude')} /></div>
              <div className="form-group"><label>City</label><input className="input" {...f('locationCity')} /></div>
              <div className="form-group"><label>State</label><input className="input" {...f('locationState')} /></div>
              <div className="form-group"><label>Zip Code</label><input className="input" {...f('locationZipCode')} /></div>
              <div className="form-group"><label>Country</label><input className="input" {...f('locationCountry')} /></div>
            </div>
            <div className="form-group" style={{ marginTop: 4 }}><label>Street Address</label><input className="input" {...f('locationStreet')} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLocation} disabled={loading}>{loading ? 'Saving...' : 'Update Location'}</button>
            </div>
          </>
        )}

        {tab === 'security' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div className="section-label">Reset User Password</div>
              <div className="form-group">
                <label>New Password (min 6 chars)</label>
                <input className="input" type="password" placeholder="New password..." value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <button className="btn btn-danger" onClick={resetPass} disabled={loading} style={{ marginTop: 8 }}>Reset Password</button>
            </div>
          </>
        )}

        {tab === 'status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Account Status</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Currently: <span style={{ color: user.isActive ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{user.isActive ? 'Active' : 'Banned'}</span></div>
                  </div>
                  <button className={user.isActive ? 'btn btn-danger' : 'btn btn-success'} onClick={async () => { const r = await api.toggleUserStatus(user.id); if (r.success) { onSave({ ...user, isActive: !user.isActive }); onClose() } }}>
                    {user.isActive ? 'Ban User' : 'Unban User'}
                  </button>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Verification</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Currently: <span style={{ color: user.isVerified ? 'var(--green)' : 'var(--gold)', fontWeight: 600 }}>{user.isVerified ? 'Verified' : 'Unverified'}</span></div>
                  </div>
                  <button className={user.isVerified ? 'btn btn-ghost' : 'btn btn-success'} onClick={async () => { const r = await api.verifyUser(user.id); if (r.success) { onSave({ ...user, isVerified: !user.isVerified }); onClose() } }}>
                    {user.isVerified ? 'Unverify' : 'Verify User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [editUser, setEditUser] = useState(null)
  const navigate = useNavigate()

  const fetch = async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: p, limit: 15 })
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    const res = await api.getUsers('?' + params)
    if (res.success) { setUsers(res.data); setTotalPages(res.totalPages || 1) }
    setLoading(false)
  }

  useEffect(() => { fetch() }, [page, role])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and ALL their data permanently?')) return
    const res = await api.deleteUser(id)
    if (res.success) setUsers(users.filter(u => u.id !== id))
  }

  return (
    <div className="page animate-in">
      <div className="page-header">
        <div className="page-header-left"><h2>Users</h2><p>Manage all registered platform users</p></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={e => { e.preventDefault(); setPage(1); fetch(1) }} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input className="input" placeholder="Search name, email, phone, city..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div style={{ display: 'flex', gap: 6 }}>
          {['', 'user', 'dj', 'admin'].map(r => (
            <button key={r} className={'btn btn-sm ' + (role === r ? 'btn-primary' : 'btn-ghost')} onClick={() => { setRole(r); setPage(1) }}>
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Phone</th><th>Role</th><th>Location</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.length === 0
                  ? <tr><td colSpan={8}><div className="empty"><p>No users found</p></div></td></tr>
                  : users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                        <div className="mono">{u.email}</div>
                      </td>
                      <td className="mono">{u.phone}</td>
                      <td><span className={'badge ' + roleBadge(u.role)}>{u.role}</span></td>
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{u.locationCity || '—'}{u.locationState ? ', ' + u.locationState : ''}</td>
                      <td><span className={'badge ' + (u.isActive ? 'badge-green' : 'badge-red')}>{u.isActive ? 'Active' : 'Banned'}</span></td>
                      <td><span className={'badge ' + (u.isVerified ? 'badge-green' : 'badge-gray')}>{u.isVerified ? 'Yes' : 'No'}</span></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => setEditUser(u)}>Edit</button>
                          <button className="btn btn-ghost btn-xs" onClick={() => navigate('/users/' + u.id)}>View</button>
                          {u.role !== 'admin' && <button className="btn btn-danger btn-xs" onClick={() => handleDelete(u.id)}>Del</button>}
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

      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={updated => { setUsers(users.map(u => u.id === updated.id ? updated : u)); setEditUser(null) }} />}
    </div>
  )
}
