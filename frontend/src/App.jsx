import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserDetail from './pages/UserDetail'
import DJs from './pages/DJs'
import DJDetail from './pages/DJDetail'
import Bookings from './pages/Bookings'
import Reports from './pages/Reports'

function Guard({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#04040a' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:36, letterSpacing:6, color:'var(--text)', marginBottom:16 }}>BASSWALA</div>
        <div style={{ width:32, height:32, border:'2px solid var(--border2)', borderTopColor:'var(--glow)', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto' }} />
      </div>
    </div>
  )
  if (!admin) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { admin } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      <Route path="/users" element={<Guard><Users /></Guard>} />
      <Route path="/users/:id" element={<Guard><UserDetail /></Guard>} />
      <Route path="/djs" element={<Guard><DJs /></Guard>} />
      <Route path="/djs/:id" element={<Guard><DJDetail /></Guard>} />
      <Route path="/bookings" element={<Guard><Bookings /></Guard>} />
      <Route path="/reports" element={<Guard><Reports /></Guard>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
