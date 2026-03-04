import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.login(form)
      if (res.success && res.user?.role === 'admin') login(res.token, res.user)
      else if (res.success) setError('Access denied — admin accounts only.')
      else setError(res.message || 'Login failed')
    } catch { setError('Cannot connect to server. Is it running on port 5000?') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      {/* BG glows */}
      <div style={{ position: 'fixed', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,111,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,255,195,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 6, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>BASSWALA</div>
          <div style={{ fontSize: 11, color: 'var(--glow)', letterSpacing: 5, textTransform: 'uppercase', fontWeight: 600 }}>Admin Console</div>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, var(--glow), transparent)', margin: '16px auto 0' }} />
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r)', padding: 32,
          boxShadow: '0 0 60px rgba(124,111,255,0.08)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 20 }}>Sign In</div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input className="input" type="email" placeholder="admin@basswala.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Enter Console →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--text3)' }}>
          Basswala Admin · Restricted Access
        </div>
      </div>
    </div>
  )
}
