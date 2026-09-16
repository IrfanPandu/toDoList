import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('Error getting session:', error)
      if (mounted) {
        setUser(data?.session?.user ?? null)
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
  }

  // Get display name: username from metadata, fallback to email prefix
  const displayName = user?.user_metadata?.username
    || user?.user_metadata?.display_name
    || user?.email?.split('@')[0]
    || 'Pengguna'

  return (
    <AuthContext.Provider value={{ user, loading, signOut, displayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
