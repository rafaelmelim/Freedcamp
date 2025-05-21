import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { SMTPClient } from 'npm:emailjs@4.0.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get email settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('email_settings')
      .select('*')
      .single()

    if (settingsError) throw new Error('Failed to fetch email settings')
    if (!settings) throw new Error('Email settings not configured')

    const { email, subject, body } = await req.json()

    // Create SMTP client
    const client = new SMTPClient({
      user: settings.smtp_username,
      password: settings.smtp_password,
      host: settings.smtp_host,
      port: settings.smtp_port,
      ssl: settings.smtp_ssl,
    })

    // Send test email
    await client.send({
      text: body,
      from: `${settings.sender_name} <${settings.sender_email}>`,
      to: email,
      subject: subject,
    })

    return new Response(
      JSON.stringify({ message: 'Test email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})