import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getUserRoles } from '../lib/roles'
import { Database } from '../lib/database.types'

type Role = Database['public']['Tables']['roles']['Row']

interface AuthContextType {
  user: User | null
  loading: boolean
  roles: Role[]
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          try {
            const userRoles = await getUserRoles(session.user.id)
            setRoles(userRoles)
          } catch (error) {
            console.error('Error fetching user roles:', error)
            // Clear session on role fetch error to prevent inconsistent state
            await supabase.auth.signOut()
            setUser(null)
            setRoles([])
          }
        } else {
          setUser(null)
          setRoles([])
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser(session.user)
          const userRoles = await getUserRoles(session.user.id)
          setRoles(userRoles)
        } else {
          setUser(null)
          setRoles([])
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(null)
        setRoles([])
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      navigate('/board')
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Clear any stored auth data first
      localStorage.removeItem('sb-' + import.meta.env.VITE_SUPABASE_PROJECT_ID + '-auth-token')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      // Clear state after successful signout
      setUser(null)
      setRoles([])
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const hasRole = (roleName: string) => {
    return roles.some(role => role.name === roleName)
  }

  const value = {
    user,
    loading,
    roles,
    signIn,
    signOut,
    hasRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}