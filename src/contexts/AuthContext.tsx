import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const navigate = useNavigate()
  const location = useLocation()

  // Verify auth token on initial app load and redirect if missing
  // But allow access to /login unconditionally
  useEffect(() => {
    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    }
  }, [token, location.pathname, navigate])

  const login = (newToken: string) => {
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    navigate('/', { replace: true })
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context anywhere in the app
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
