import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "../utils/api"

const sColor = s => ({ Completed:"badge-green", Pending:"badge-gold", Cancelled:"badge-red", Confirmed:"badge-blue", "In Progress":"badge-purple" }[s] || "badge-gray")

export default function DJDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dj, setDJ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("info")
  const [edit, setEdit] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [assignUserId, setAssignUserId] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await api.getDJ(id)
    if (res.success) {
      setDJ(res.data)
      setEdit({ ...res.data, genres: (res.data.genres||[]).join(", ") })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const saveInfo = async () => {
    setSaving(true); setMsg(""); setErr("")
    const payload = { ...edit, genres: edit.genres.split(",").map(g => g.trim()).filter(Boolean), hourlyRate: parseFloat(edit.hourlyRate), latitude: parseFloat(edit.latitude), longitude: parseFloat(edit.longitude) }
    const res = await api.updateDJ(id, payload)
    if (res.success) { setMsg("DJ updated!"); setDJ(d => ({ ...d, ...res.data })) }
    else setErr(res.message || "Error")
    setSaving(false)
  }

  const assignOwner = async () => {
    if (!assignUserId) return setErr("Enter a user ID")
    setSaving(true); setErr(""); setMsg("")
    const res = await api.assignDJOwner(id, parseInt(assignUserId))
    if (res.success) { setMsg("Owner assigned!"); load() }
    else setErr(res.message || "Error")
    setSaving(false)
  }

  const toggleAvail = async () => {
    const res = await api.toggleDJAvail(id)
    if (res.success) setDJ(d => ({ ...d, isAvailable: !d.isAvailable }))
  }

  const deleteDJ = async () => {
    if (!confirm("Delete this DJ and all related bookings?")) return
    const res = await api.deleteDJ(id)
    if (res.success) navigate("/djs")
  }

  if (loading) return <div className="loading"><div className="spinner"/><p>Loading DJ...</p></div>
  if (!dj) return <div className="alert alert-error">DJ not found</div>

  const f = field => ({ value: edit[field] ?? "", onChange: e => setEdit({ ...edit, [field]: e.target.value }) })

  return (
    <div className="page animate-in">
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/djs")}>Back to DJs</button>
        <div style={{ flex:1 }}>
          <h2 style={{ fontSize:24, marginBottom:6 }}>{dj.name}</h2>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span className={"badge "+(dj.isAvailable?"badge-green":"badge-red")}>{dj.isAvailable?"Available":"Offline"}</span>
            <span style={{ color:"var(--gold)", fontSize:13 }}>Rs.{dj.hourlyRate}/hr</span>
            <span style={{ color:"var(--text3)", fontSize:13 }}>|</span>
            <span style={{ color:"var(--gold)" }}>* {dj.ratingAverage||0} ({dj.ratingCount||0} reviews)</span>
            {dj.locationCity && <span style={{ color:"var(--text2)", fontSize:13 }}>{dj.locationCity}, {dj.locationState}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className={dj.isAvailable?"btn btn-danger btn-sm":"btn btn-success btn-sm"} onClick={toggleAvail}>
            {dj.isAvailable?"Disable":"Enable"}
          </button>
          <button className="btn btn-danger btn-sm" onClick={deleteDJ}>Delete DJ</button>
        </div>
      </div>

      {dj.bookingStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          {[{label:"Total",val:dj.bookingStats.total,color:"var(--glow)"},{label:"Completed",val:dj.bookingStats.completed,color:"var(--green)"},{label:"Pending",val:dj.bookingStats.pending,color:"var(--gold)"},{label:"Cancelled",val:dj.bookingStats.cancelled,color:"var(--red)"}].map(s => (
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
        {["info","location","owner","bookings"].map(t => (
          <button key={t} className={"tab-btn "+(tab===t?"active":"")} onClick={() => { setTab(t); setMsg(""); setErr("") }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="card">
          <div className="card-header"><h3>DJ Information</h3></div>
          <div className="card-body">
            <div className="form-grid" style={{ marginBottom:14 }}>
              <div className="form-group"><label>DJ Name</label><input className="input" {...f("name")} /></div>
              <div className="form-group"><label>Hourly Rate</label><input className="input" type="number" {...f("hourlyRate")} /></div>
              <div className="form-group"><label>Min Hours</label><input className="input" type="number" {...f("minimumHours")} /></div>
              <div className="form-group"><label>Currency</label><select className="input" {...f("currency")}><option value="INR">INR</option><option value="USD">USD</option></select></div>
              <div className="form-group"><label>Available</label><select className="input" value={edit.isAvailable?"true":"false"} onChange={e => setEdit({...edit,isAvailable:e.target.value==="true"})}><option value="true">Yes</option><option value="false">No</option></select></div>
              <div className="form-group"><label>Rating Avg</label><input className="input" type="number" step="0.1" min="0" max="5" {...f("ratingAverage")} /></div>
              <div className="form-group"><label>Rating Count</label><input className="input" type="number" {...f("ratingCount")} /></div>
            </div>
            <div className="form-group" style={{ marginBottom:14 }}><label>Description</label><textarea className="input" rows={3} {...f("description")} /></div>
            <div className="form-group" style={{ marginBottom:16 }}><label>Genres (comma separated)</label><input className="input" {...f("genres")} placeholder="Bollywood, EDM, Hip-Hop" /></div>
            <button className="btn btn-primary" disabled={saving} onClick={saveInfo}>{saving?"Saving...":"Save Changes"}</button>
          </div>
        </div>
      )}

      {tab === "location" && (
        <div className="card">
          <div className="card-header"><h3>Location</h3></div>
          <div className="card-body">
            <div className="form-grid" style={{ marginBottom:16 }}>
              <div className="form-group"><label>City</label><input className="input" {...f("locationCity")} /></div>
              <div className="form-group"><label>State</label><input className="input" {...f("locationState")} /></div>
              <div className="form-group"><label>Country</label><input className="input" {...f("locationCountry")} /></div>
              <div className="form-group"><label>Latitude</label><input className="input" type="number" step="any" {...f("latitude")} /></div>
              <div className="form-group"><label>Longitude</label><input className="input" type="number" step="any" {...f("longitude")} /></div>
            </div>
            <button className="btn btn-primary" disabled={saving} onClick={saveInfo}>{saving?"Saving...":"Update Location"}</button>
          </div>
        </div>
      )}

      {tab === "owner" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div className="card">
            <div className="card-header"><h3>Current Owner</h3></div>
            <div className="card-body">
              {dj.owner ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:14, background:"var(--raised)", borderRadius:8 }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,var(--glow),var(--glow2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff" }}>
                      {dj.owner.firstName?.[0]}{dj.owner.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:600 }}>{dj.owner.firstName} {dj.owner.lastName}</div>
                      <div className="mono">{dj.owner.email}</div>
                      <div className="mono">{dj.owner.phone}</div>
                    </div>
                  </div>
                  <div className="info-row"><span className="info-row-label">User ID</span><span className="info-row-value">#{dj.owner.id}</span></div>
                  <div className="info-row"><span className="info-row-label">Status</span><span className="info-row-value">{dj.owner.isActive?"Active":"Banned"}</span></div>
                  <div className="info-row"><span className="info-row-label">Verified</span><span className="info-row-value">{dj.owner.isVerified?"Yes":"No"}</span></div>
                </>
              ) : (
                <p style={{ color:"var(--text3)", fontSize:13 }}>No owner assigned to this DJ profile.</p>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Reassign Owner</h3></div>
            <div className="card-body">
              <p style={{ color:"var(--text2)", fontSize:13, marginBottom:16 }}>Enter a User ID to assign this DJ profile to a different user.</p>
              <div className="form-group" style={{ marginBottom:16 }}>
                <label>New Owner User ID</label>
                <input className="input" type="number" placeholder="e.g. 5" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} />
              </div>
              <button className="btn btn-primary" disabled={saving} onClick={assignOwner}>{saving?"Assigning...":"Assign Owner"}</button>
            </div>
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="card">
          <div className="card-header"><h3>All Bookings ({dj.bookings?.length || 0})</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>User</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
              <tbody>
                {!dj.bookings?.length
                  ? <tr><td colSpan={7}><div className="empty"><p>No bookings yet</p></div></td></tr>
                  : dj.bookings.map(b => (
                    <tr key={b.id}>
                      <td className="mono" style={{color:"var(--text3)"}}>#{b.id}</td>
                      <td>
                        <div style={{fontWeight:500}}>{b.user?.firstName} {b.user?.lastName}</div>
                        <div className="mono">{b.user?.phone}</div>
                      </td>
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
