import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { SMTPClient } from 'npm:emailjs@4.0.3'

interface TestEmailRequest {
  email: string
  subject: string
  body: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const { email, subject, body }: TestEmailRequest = await req.json()

const { data: settings, error: settingsError } = await supabaseClient
  .from('email_settings')
  .select('*')
  .limit(1)

await client.send({
  text: body,
  from: `${settings.sender_name} <${settings.sender_email}>`,
  to: email,
  subject: subject,
})