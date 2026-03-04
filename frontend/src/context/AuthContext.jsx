import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext()

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tok = localStorage.getItem('bw_admin_token')
    const usr = localStorage.getItem('bw_admin_user')
    if (tok && usr) {
      const parsed = JSON.parse(usr)
      if (parsed.role === 'admin') setAdmin(parsed)
      else logout()
    }
    setLoading(false)
  }, [])

  const login = (token, user) => {
    localStorage.setItem('bw_admin_token', token)
    localStorage.setItem('bw_admin_user', JSON.stringify(user))
    setAdmin(user)
  }

  const logout = () => {
    localStorage.removeItem('bw_admin_token')
    localStorage.removeItem('bw_admin_user')
    setAdmin(null)
  }

  return <Ctx.Provider value={{ admin, login, logout, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
