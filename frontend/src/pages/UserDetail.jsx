import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'

const sColor = s => ({ Completed:'badge-green', Pending:'badge-gold', Cancelled:'badge-red', Confirmed:'badge-blue', 'In Progress':'badge-purple' }[s] || 'badge-gray')

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value ?? <span style={{color:"var(--text3)"}}>Not set</span>}</span>
    </div>
  )
}

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("profile")
  const [edit, setEdit] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [newPass, setNewPass] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await api.getUser(id)
    if (res.success) { setUser(res.data); setEdit(res.data) }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const saveInfo = async () => {
    setSaving(true); setMsg(""); setErr("")
    const res = await api.updateUser(id, { firstName:edit.firstName, lastName:edit.lastName, email:edit.email, phone:edit.phone, dateOfBirth:edit.dateOfBirth, role:edit.role })
    if (res.success) { setMsg("Saved!"); setUser(u => ({ ...u, ...res.data })) }
    else setErr(res.message || "Error")
    setSaving(false)
  }

  const saveLoc = async () => {
    setSaving(true); setMsg(""); setErr("")
    const res = await api.updateUserLocation(id, { latitude:edit.latitude, longitude:edit.longitude, locationStreet:edit.locationStreet, locationCity:edit.locationCity, locationState:edit.locationState, locationZipCode:edit.locationZipCode, locationCountry:edit.locationCountry })
    if (res.success) { setMsg("Location saved!"); setUser(u => ({ ...u, ...res.data })) }
    else setErr(res.message || "Error")
    setSaving(false)
  }

  const resetPwd = async () => {
    if (!newPass || newPass.length < 6) return setErr("Min 6 characters required")
    setSaving(true); setErr(""); setMsg("")
    const res = await api.resetUserPassword(id, newPass)
    if (res.success) { setMsg("Password reset!"); setNewPass("") }
    else setErr(res.message)
    setSaving(false)
  }

  if (loading) return <div className="loading"><div className="spinner"/><p>Loading user...</p></div>
  if (!user) return <div className="alert alert-error">User not found</div>

  const f = field => ({ value: edit[field] || "", onChange: e => setEdit({ ...edit, [field]: e.target.value }) })

  return (
    <div className="page animate-in">
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/users")}>Back to Users</button>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,var(--glow),var(--glow2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <h2 style={{ fontSize:24, marginBottom:6 }}>{user.firstName} {user.lastName}</h2>
            <div style={{ display:"flex", gap:8 }}>
              <span className={"badge "+(user.role==="dj"?"badge-gold":user.role==="admin"?"badge-purple":"badge-blue")}>{user.role}</span>
              <span className={"badge "+(user.isActive?"badge-green":"badge-red")}>{user.isActive?"Active":"Banned"}</span>
              <span className={"badge "+(user.isVerified?"badge-green":"badge-gray")}>{user.isVerified?"Verified":"Unverified"}</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className={user.isActive?"btn btn-danger btn-sm":"btn btn-success btn-sm"} onClick={async () => { await api.toggleUserStatus(id); load() }}>
            {user.isActive ? "Ban User" : "Unban"}
          </button>
          <button className={user.isVerified?"btn btn-ghost btn-sm":"btn btn-success btn-sm"} onClick={async () => { await api.verifyUser(id); load() }}>
            {user.isVerified ? "Unverify" : "Verify"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={async () => { if (!confirm("Delete this user permanently?")) return; const r = await api.deleteUser(id); if (r.success) navigate("/users") }}>Delete</button>
        </div>
      </div>

      {user.bookingStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          {[{label:"Total",val:user.bookingStats.total,color:"var(--glow)"},{label:"Completed",val:user.bookingStats.completed,color:"var(--green)"},{label:"Pending",val:user.bookingStats.pending,color:"var(--gold)"},{label:"Cancelled",val:user.bookingStats.cancelled,color:"var(--red)"}].map(s => (
            <div key={s.label} className="card" style={{ padding:18 }}>
              <div style={{ fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:30, fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {msg && <div className="alert alert-success" style={{ marginBottom:16 }}>{msg}</div>}
      {err && <div className="alert alert-error" style={{ marginBottom:16 }}>{err}</div>}

      <div className="tabs">
        {["profile","location","security","bookings"].map(t => (
          <button key={t} className={"tab-btn "+(tab===t?"active":"")} onClick={() => { setTab(t); setMsg(""); setErr("") }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div className="card">
            <div className="card-header"><h3>Edit Info</h3></div>
            <div className="card-body">
              <div className="form-grid" style={{ marginBottom:16 }}>
                <div className="form-group"><label>First Name</label><input className="input" {...f("firstName")} /></div>
                <div className="form-group"><label>Last Name</label><input className="input" {...f("lastName")} /></div>
                <div className="form-group"><label>Email</label><input className="input" type="email" {...f("email")} /></div>
                <div className="form-group"><label>Phone</label><input className="input" {...f("phone")} /></div>
                <div className="form-group"><label>Date of Birth</label><input className="input" type="date" {...f("dateOfBirth")} /></div>
                <div className="form-group"><label>Role</label>
                  <select className="input" value={edit.role||"user"} onChange={e => setEdit({...edit,role:e.target.value})}>
                    <option value="user">User</option><option value="dj">DJ</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" disabled={saving} onClick={saveInfo}>{saving?"Saving...":"Save Changes"}</button>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Account Details</h3></div>
            <div className="card-body">
              <InfoRow label="User ID" value={"#" + user.id} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Role" value={user.role} />
              <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString("en-IN")} />
              <InfoRow label="Last Login" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString("en-IN") : "Never"} />
              {user.djProfile && <InfoRow label="DJ Profile" value={user.djProfile.name + " (ID: " + user.djProfile.id + ")"} />}
            </div>
          </div>
        </div>
      )}

      {tab === "location" && (
        <div className="card">
          <div className="card-header"><h3>Location</h3></div>
          <div className="card-body">
            <div className="form-grid" style={{ marginBottom:14 }}>
              <div className="form-group"><label>City</label><input className="input" {...f("locationCity")} /></div>
              <div className="form-group"><label>State</label><input className="input" {...f("locationState")} /></div>
              <div className="form-group"><label>Zip Code</label><input className="input" {...f("locationZipCode")} /></div>
              <div className="form-group"><label>Country</label><input className="input" {...f("locationCountry")} /></div>
              <div className="form-group"><label>Latitude</label><input className="input" type="number" step="any" {...f("latitude")} /></div>
              <div className="form-group"><label>Longitude</label><input className="input" type="number" step="any" {...f("longitude")} /></div>
            </div>
            <div className="form-group" style={{ marginBottom:16 }}><label>Street</label><input className="input" {...f("locationStreet")} /></div>
            <button className="btn btn-primary" disabled={saving} onClick={saveLoc}>{saving?"Saving...":"Update Location"}</button>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="card" style={{ maxWidth:500 }}>
          <div className="card-header"><h3>Reset Password</h3></div>
          <div className="card-body">
            <p style={{ color:"var(--text2)", fontSize:13, marginBottom:16 }}>Set a new password for this user account.</p>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label>New Password (min 6 characters)</label>
              <input className="input" type="password" placeholder="New password..." value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <button className="btn btn-danger" disabled={saving} onClick={resetPwd}>{saving?"Resetting...":"Reset Password"}</button>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="card">
          <div className="card-header"><h3>All Bookings ({user.bookings?.length || 0})</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>DJ</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
              <tbody>
                {!user.bookings?.length
                  ? <tr><td colSpan={7}><div className="empty"><p>No bookings yet</p></div></td></tr>
                  : user.bookings.map(b => (
                    <tr key={b.id}>
                      <td className="mono" style={{color:"var(--text3)"}}>#{b.id}</td>
                      <td style={{fontWeight:500}}>{b.dj?.name||"—"}</td>
                      <td>{b.eventType}</td>
                      <td style={{color:"var(--text2)",fontSize:12}}>{b.eventDate?new Date(b.eventDate).toLocaleDateString("en-IN"):"—"}</td>
                      <td style={{color:"var(--gold)",fontWeight:600}}>Rs.{b.totalAmount}</td>
                      <td><span className={"badge "+sColor(b.status)}>{b.status}</span></td>
                      <td><span className={"badge "+(b.paymentStatus==="Paid"?"badge-green":b.paymentStatus==="Refunded"?"badge-orange":"badge-gold")}>{b.paymentStatus}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
