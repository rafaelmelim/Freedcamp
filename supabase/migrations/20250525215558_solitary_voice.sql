/*
  # Add new appearance fields to system settings

  1. Changes
    - Add new columns for form positioning
    - Add system font color
    - Add default header description
    - Add form layout settings
*/

ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS form_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS header_style text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS footer_style text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS system_font_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS default_header_description text,
ADD COLUMN IF NOT EXISTS form_layout text DEFAULT 'default';

-- Update existing settings with default values
UPDATE system_settings
SET 
  form_position = 'center',
  header_style = 'default',
  footer_style = 'default',
  system_font_color = '#000000',
  default_header_description = 'Sistema de gerenciamento de projetos e tarefas',
  form_layout = 'default'
WHERE form_position IS NULL;