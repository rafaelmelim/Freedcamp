/*
  # Email System Setup

  1. New Tables
    - `email_settings`: Stores SMTP configuration
      - `id` (uuid, primary key)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_ssl` (boolean)
      - `smtp_username` (text)
      - `smtp_password` (text)
      - `sender_email` (text)
      - `sender_name` (text)
      - Timestamps for created_at and updated_at

    - `email_templates`: Stores email templates
      - `id` (uuid, primary key)
      - `type` (text, unique)
      - `subject` (text)
      - `body` (text)
      - Timestamps for created_at and updated_at

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access
    - Add unique constraint on template type

  3. Default Data
    - Insert default SMTP settings
    - Insert default email templates for password reset and registration
*/

-- Create email settings table if it doesn't exist
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
DROP POLICY IF EXISTS "Admins can manage email settings" ON email_settings;

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

-- Create email templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_templates_type_key'
    AND table_name = 'email_templates'
  ) THEN
    ALTER TABLE email_templates DROP CONSTRAINT email_templates_type_key;
  END IF;
END $$;

-- Add unique constraint on template type
ALTER TABLE email_templates ADD CONSTRAINT email_templates_type_key UNIQUE (type);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;

-- Create policy for admin users
CREATE POLICY "Admins can manage email templates"
  ON email_templates
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

-- Insert default email settings if they don't exist
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

-- Insert default email templates
INSERT INTO email_templates (type, subject, body) VALUES
  (
    'reset_password',
    'Reset Your Password',
    'Hello {{name}},\n\nYou have requested to reset your password. Click the following link to set a new password:\n\n{{link}}\n\nIf you did not request this change, please ignore this email.\n\nBest regards,\nYour Team'
  ),
  (
    'registration',
    'Welcome to Our Platform',
    'Hello {{name}},\n\nWelcome to our platform! We''re excited to have you on board.\n\nTo get started, please verify your email by clicking the following link:\n\n{{link}}\n\nBest regards,\nYour Team'
  ) ON CONFLICT (type) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body;