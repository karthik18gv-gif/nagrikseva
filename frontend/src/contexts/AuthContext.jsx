import { createContext, useContext, useState, useEffect } from 'react'
const AuthContext = createContext(null)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = localStorage.getItem('ns_token')
    const u = localStorage.getItem('ns_user')
    const r = localStorage.getItem('ns_role')
    if (t && u && r) { setToken(t); setUser(JSON.parse(u)); setRole(r) }
    setLoading(false)
  }, [])
  const login = (userData, userToken, userRole) => {
    setUser(userData); setToken(userToken); setRole(userRole)
    localStorage.setItem('ns_token', userToken)
    localStorage.setItem('ns_user', JSON.stringify(userData))
    localStorage.setItem('ns_role', userRole)
  }
  const logout = () => {
    setUser(null); setToken(null); setRole(null)
    localStorage.removeItem('ns_token')
    localStorage.removeItem('ns_user')
    localStorage.removeItem('ns_role')
  }
  const updateUser = (userData) => { setUser(userData); localStorage.setItem('ns_user', JSON.stringify(userData)) }
  return (
    <AuthContext.Provider value={{ user, role, token, loading, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
