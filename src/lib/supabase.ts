import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Enhanced connection test with retry logic
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing Supabase connection (attempt ${attempt}/${retries})...`)
      
      // Simple health check
      const { data, error } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        throw error
      }
      
      console.log('✅ Supabase connection successful')
      return true
    } catch (error: any) {
      console.warn(`❌ Connection attempt ${attempt} failed:`, error.message)
      
      if (attempt === retries) {
        console.error('🚨 All connection attempts failed. Please check:')
        console.error('1. Your internet connection')
        console.error('2. Supabase project status at https://supabase.com/dashboard')
        console.error('3. Environment variables in .env file')
        console.error('4. Firewall/proxy settings')
        return false
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  return false
}

// Test connection on initialization with better error handling
testSupabaseConnection().catch(error => {
  console.error('Initial connection test failed:', error)
})