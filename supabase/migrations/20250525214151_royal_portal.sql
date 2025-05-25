/*
  # Create system settings table
  
  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `site_name` (text)
      - `site_description` (text)
      - `primary_color` (text)
      - `logo_url` (text)
      - `favicon_url` (text)
      - `footer_text` (text)
      - `layout_type` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `system_settings` table
    - Add policy for admin users to manage settings
    - Add policy for authenticated users to read settings
*/

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Controle de Projetos',
  site_description text,
  primary_color text DEFAULT '#0EA5E9',
  logo_url text,
  favicon_url text,
  footer_text text,
  layout_type text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage system settings"
  ON system_settings
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

CREATE POLICY "Authenticated users can read system settings"
  ON system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default settings
INSERT INTO system_settings (
  site_name,
  site_description,
  primary_color,
  footer_text,
  layout_type
) VALUES (
  'Controle de Projetos - Alpha_v_001',
  'Sistema de gerenciamento de projetos e tarefas',
  '#0EA5E9',
  '© 2025 Controle de Projetos - Alpha_v_001. Todos os direitos reservados.',
  'default'
) ON CONFLICT DO NOTHING;