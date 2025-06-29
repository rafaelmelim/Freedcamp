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

// Enhanced connection test with retry logic and better error reporting
export const testSupabaseConnection = async (retries = 3): Promise<boolean> => {
  console.log('🔍 Supabase Configuration Check:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...')
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing Supabase connection (attempt ${attempt}/${retries})...`)
      
      // Simple health check with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const { data: _data, error } = await supabase
        .from('system_settings')
        .select('id')
        .abortSignal(controller.signal)
        .limit(1)
        .maybeSingle()
      
      clearTimeout(timeoutId)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        throw error
      }
      
      console.log('✅ Supabase connection successful')
      return true
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`❌ Connection attempt ${attempt} timed out after 10 seconds`)
      } else {
      console.warn(`❌ Connection attempt ${attempt} failed:`, error.message)
      }
      
      if (attempt === retries) {
        console.error('🚨 All connection attempts failed. Please check:')
        console.error('1. Your internet connection')
        console.error('2. Supabase project status at https://supabase.com/dashboard')
        console.error('3. Environment variables in .env file')
        console.error('   - VITE_SUPABASE_URL should be: https://your-project-id.supabase.co')
        console.error('   - VITE_SUPABASE_ANON_KEY should be your public anon key')
        console.error('4. Firewall/proxy settings')
        console.error('5. CORS settings in your Supabase project')
        return false
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
  
  return false
}

// Function to validate environment variables
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is missing')
  } else if (!import.meta.env.VITE_SUPABASE_URL.includes('supabase.co')) {
    errors.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL')
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing')
  } else if (import.meta.env.VITE_SUPABASE_ANON_KEY.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY appears to be too short (should be ~100+ characters)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Test connection on initialization with better error handling
const initializeSupabase = async () => {
  const validation = validateEnvironment()
  
  if (!validation.isValid) {
    console.error('🚨 Environment validation failed:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    console.error('\nPlease check your .env file and ensure it contains:')
    console.error('VITE_SUPABASE_URL=https://your-project-id.supabase.co')
    console.error('VITE_SUPABASE_ANON_KEY=your-anon-key-here')
    return
  }
  
  const isConnected = await testSupabaseConnection()
  if (!isConnected) {
    console.error('🚨 Failed to establish connection to Supabase')
  }
}

initializeSupabase().catch(error => {
  console.error('Initialization error:', error)
})