/*
  # Email Settings Configuration

  1. New Tables
    - `email_settings`
      - `id` (uuid, primary key)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_ssl` (boolean)
      - `smtp_username` (text)
      - `smtp_password` (text)
      - `sender_email` (text)
      - `sender_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_settings` table
    - Add policy for admin users to manage settings
*/

-- Create email settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL,
  smtp_ssl boolean DEFAULT true,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  sender_email text NOT NULL,
  sender_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can manage email settings" ON email_settings;
END $$;

-- Create policy for admin users
CREATE POLICY "Admins can manage email settings"
  ON email_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.profile_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.profile_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Insert default email settings
INSERT INTO email_settings (
  smtp_host,
  smtp_port,
  smtp_ssl,
  smtp_username,
  smtp_password,
  sender_email,
  sender_name
) VALUES (
  'smtp.gmail.com',
  587,
  true,
  'your-email@gmail.com',
  'your-app-specific-password',
  'noreply@yourdomain.com',
  'Your Company Name'
) ON CONFLICT DO NOTHING;