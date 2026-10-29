import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser())
  const [role, setRole] = useState(() => tokenStore.getRole())
  const [loading, setLoading] = useState(() => Boolean(tokenStore.getAccess()))

  useEffect(() => {
    let active = true
    if (!tokenStore.getAccess()) {
      setLoading(false)
      return undefined
    }
    const restoreSession = async () => {
      const currentUser = await api.getMe()
      if (tokenStore.getRole() === 'user') return { currentUser, role: 'user' }
      try {
        await api.verifyAdmin()
        tokenStore.setRole('admin')
        return { currentUser, role: 'admin' }
      } catch (error) {
        if (error.status === 403) {
          tokenStore.setRole('user')
          return { currentUser, role: 'user' }
        }
        throw error
      }
    }
    restoreSession()
      .then((session) => {
        if (!active) return
        setUser(session.currentUser)
        setRole(session.role)
      })
      .catch(() => {
        if (!active) return
        tokenStore.clear()
        setUser(null)
        setRole(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      role,
      isAdmin: role === 'admin',
      isUser: role === 'user',
      loading,
      async loginAdmin(email, password) {
        setLoading(true)
        try {
          const data = await api.loginAdmin(email, password)
          setUser(data.user)
          setRole('admin')
          return data
        } catch (error) {
          setUser(null)
          setRole(null)
          throw error
        } finally {
          setLoading(false)
        }
      },
      async loginUser(email, password) {
        setLoading(true)
        try {
          const data = await api.loginUser(email, password)
          setUser(data.user)
          setRole('user')
          return data
        } catch (error) {
          setUser(null)
          setRole(null)
          throw error
        } finally {
          setLoading(false)
        }
      },
      async logout() {
        try {
          await api.logout()
        } finally {
          setUser(null)
          setRole(null)
        }
      },
    }),
    [loading, role, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
