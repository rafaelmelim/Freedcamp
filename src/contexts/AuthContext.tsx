import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, AuthSessionMissingError, AuthApiError } from '@supabase/supabase-js'
import { supabase, testSupabaseConnection, validateEnvironment } from '../lib/supabase'
import { getUserRoles } from '../lib/roles'
import { Database } from '../lib/database.types'

type Role = Database['public']['Tables']['roles']['Row']

interface AuthContextType {
  user: User | null
  loading: boolean
  roles: Role[]
  connectionError: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  hasRole: (roleName: string) => boolean
  retryConnection: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  const navigate = useNavigate()

  const retryConnection = async () => {
    console.log('🔄 Retrying connection...')
    
    // First validate environment
    const validation = validateEnvironment()
    if (!validation.isValid) {
      console.error('❌ Environment validation failed:')
      validation.errors.forEach(error => console.error(`  - ${error}`))
      setConnectionError(true)
      setLoading(false)
      return
    }
    
    setConnectionError(false)
    setLoading(true)
    
    const isConnected = await testSupabaseConnection()
    if (isConnected) {
      // Retry auth initialization
      await initAuth()
    } else {
      console.error('❌ Connection retry failed')
      setConnectionError(true)
      setLoading(false)
    }
  }

  const initAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }
      
      if (session?.user) {
        setUser(session.user)
        try {
          const userRoles = await getUserRoles(session.user.id)
          setRoles(userRoles)
          setConnectionError(false)
        } catch (error: any) {
          console.error('Error fetching user roles:', error)
          
          // Check if it's a network error or connection issue
          if (error.message?.includes('NetworkError') || 
              error.message?.includes('fetch') || 
              error.message?.includes('Failed to fetch') ||
              error.name === 'TypeError') {
            console.error('🌐 Network connectivity issue detected')
            setConnectionError(true)
            return
          }
          
          // Clear session on other role fetch errors
          console.warn('🔐 Clearing session due to role fetch error')
          await supabase.auth.signOut()
          setUser(null)
          setRoles([])
        }
      } else {
        setUser(null)
        setRoles([])
        setConnectionError(false)
      }
    } catch (error: any) {
      console.error('Error initializing auth:', error)
      
      // Check for refresh token errors
      if (error.message?.includes('Refresh Token Not Found') || 
          error.message?.includes('Invalid Refresh Token')) {
        console.warn('🔐 Invalid refresh token detected, clearing session')
        await supabase.auth.signOut()
        setUser(null)
        setRoles([])
        navigate('/login')
        return
      }
      
      // Check if it's a network error or connection issue
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('fetch') || 
          error.message?.includes('Failed to fetch') ||
          error.name === 'TypeError') {
        console.error('🌐 Network connectivity issue during auth initialization')
        setConnectionError(true)
      } else {
        setUser(null)
        setRoles([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          setUser(session.user)
          try {
            const userRoles = await getUserRoles(session.user.id)
            setRoles(userRoles)
            setConnectionError(false)
          } catch (error: any) {
            console.error('Error fetching user roles in auth state change:', error)
            
            // Check if it's a network error or connection issue
            if (error.message?.includes('NetworkError') || 
                error.message?.includes('fetch') || 
                error.message?.includes('Failed to fetch') ||
                error.name === 'TypeError') {
              console.error('🌐 Network connectivity issue in auth state change')
              setConnectionError(true)
            }
          }
        } else {
          setUser(null)
          setRoles([])
          setConnectionError(false)
        }
      } catch (error: any) {
        console.error('Error in auth state change:', error)
        
        // Check for refresh token errors
        if (error.message?.includes('Refresh Token Not Found') || 
            error.message?.includes('Invalid Refresh Token')) {
          console.warn('🔐 Invalid refresh token detected in auth state change, clearing session')
          await supabase.auth.signOut()
          setUser(null)
          setRoles([])
          navigate('/login')
          return
        }
        
        // Check if it's a network error or connection issue
        if (error.message?.includes('NetworkError') || 
            error.message?.includes('fetch') || 
            error.message?.includes('Failed to fetch') ||
            error.name === 'TypeError') {
          console.error('🌐 Network connectivity issue in auth state change handler')
          setConnectionError(true)
        } else {
          setUser(null)
          setRoles([])
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setConnectionError(false)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha incorretos. Por favor, verifique suas credenciais.')
        }
        if (error.message?.includes('NetworkError') || 
            error.message?.includes('fetch') || 
            error.message?.includes('Failed to fetch') ||
            error.name === 'TypeError') {
          console.error('🌐 Network connectivity issue during sign in')
          setConnectionError(true)
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.')
        }
        throw error
      }

      navigate('/board')
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('fetch') || 
          error.message?.includes('Failed to fetch') ||
          error.name === 'TypeError') {
        console.error('🌐 Network connectivity issue during sign in process')
        setConnectionError(true)
      }
      
      throw error
    }
  }

  const signOut = async () => {
    try {
      // Clear state before signout to prevent race conditions
      setUser(null)
      setRoles([])
      setConnectionError(false)

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        // Handle session_not_found error as a successful logout
        if (error instanceof AuthApiError && error.status === 403 && error.message?.includes('session_not_found')) {
          console.log('Session already expired/invalidated, proceeding with navigation')
          navigate('/login')
          return
        }
        
        if (error.message?.includes('NetworkError') || 
            error.message?.includes('fetch') || 
            error.message?.includes('Failed to fetch') ||
            error.name === 'TypeError') {
          // If it's a network error during signout, still navigate to login
          console.warn('🌐 Network error during signout, proceeding with navigation')
          navigate('/login')
          return
        }
        throw error
      }

      navigate('/login')
    } catch (error: any) {
      // Handle the case where session is already missing/invalid
      if (error instanceof AuthSessionMissingError) {
        console.log('Session already cleared, proceeding with navigation')
        navigate('/login')
      } else if (error instanceof AuthApiError && error.status === 403 && error.message?.includes('session_not_found')) {
        console.log('Session not found during signout, proceeding with navigation')
        navigate('/login')
      } else {
        console.error('Sign out error:', error)
        
        if (error.message?.includes('NetworkError') || 
            error.message?.includes('fetch') || 
            error.message?.includes('Failed to fetch') ||
            error.name === 'TypeError') {
          // If it's a network error, still navigate to login
          console.warn('🌐 Network error during signout, navigating to login')
          navigate('/login')
        } else {
          // Don't re-throw the error, just navigate to login
          navigate('/login')
        }
      }
    }
  }

  const hasRole = (roleName: string) => {
    return roles.some(role => role.name === roleName)
  }

  const value = {
    user,
    loading,
    roles,
    connectionError,
    signIn,
    signOut,
    hasRole,
    retryConnection,
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