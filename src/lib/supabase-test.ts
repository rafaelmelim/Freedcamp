import { supabase } from './supabase'

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase error:', error)
      return { success: false, error }
    }
    
    console.log('Supabase connection successful:', data)
    return { success: true, data }
  } catch (err) {
    console.error('Network error:', err)
    return { success: false, error: err }
  }
}