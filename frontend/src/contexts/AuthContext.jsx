import { createContext, useContext, useState, useEffect } from 'react'
import api, { SESSION_EXPIRED_EVENT } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuthState = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        JSON.parse(userData)
      } catch (error) {
        console.error('AuthContext: Error parsing user data:', error)
        clearAuthState()
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        if (response.data.success) {
          const updatedUser = response.data.data.user
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        } else {
          clearAuthState()
        }
      } catch (error) {
        const status = error?.response?.status;

        if (status === 401) {
          toast.error('Сессия истекла, войдите снова')
          clearAuthState()
        } else {


          console.warn('Auth check failed (non-auth error):', status || error.message)
        }
      }

      setLoading(false)
    }

    initializeAuth()
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser((currentUser) => {
        if (currentUser) {
          toast.error('Сессия истекла, войдите снова')
        }

        return null
      })
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      return userData
    } catch (error) {
      console.error('AuthContext: Login failed', error)
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user: newUser } = response.data.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)

      return newUser
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    clearAuthState()
  }

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        const updatedUser = response.data.data.user
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        return updatedUser
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error)

      if (error?.response?.status === 401) {
        clearAuthState()
        toast.error('Сессия истекла, войдите снова')
      }

      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
