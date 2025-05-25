/*
  # Create Import/Export Settings Table

  1. New Tables
    - `import_export_settings`
      - `id` (uuid, primary key)
      - `field_name` (text) - Name of the field
      - `entity_type` (text) - Either 'project' or 'task'
      - `enabled` (boolean) - Whether the field is enabled for import/export
      - `label` (text) - Display label for the field
      - `description` (text) - Description of the field
      - `owner_id` (uuid) - Reference to profiles table
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `import_export_settings` table
    - Add policies for authenticated users to manage their own settings
*/

-- Create import/export settings table
CREATE TABLE IF NOT EXISTS import_export_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'task')),
  enabled boolean DEFAULT true,
  label text NOT NULL,
  description text,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (field_name, entity_type, owner_id)
);

-- Enable RLS
ALTER TABLE import_export_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own import/export settings"
  ON import_export_settings
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Create trigger for updating updated_at
CREATE TRIGGER update_import_export_settings_updated_at
  BEFORE UPDATE ON import_export_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for projects
INSERT INTO import_export_settings (field_name, entity_type, enabled, label, description)
VALUES
  ('id', 'project', true, 'ID', 'Identificador único do projeto'),
  ('title', 'project', true, 'Título', 'Título do projeto'),
  ('position', 'project', true, 'Posição', 'Posição do projeto no quadro'),
  ('owner_id', 'project', true, 'Proprietário', 'ID do proprietário do projeto'),
  ('created_at', 'project', true, 'Data de Criação', 'Data de criação do projeto'),
  ('updated_at', 'project', true, 'Data de Atualização', 'Data da última atualização do projeto');

-- Insert default settings for tasks
INSERT INTO import_export_settings (field_name, entity_type, enabled, label, description)
VALUES
  ('id', 'task', true, 'ID', 'Identificador único da tarefa'),
  ('project_id', 'task', true, 'Projeto', 'ID do projeto associado'),
  ('title', 'task', true, 'Título', 'Título da tarefa'),
  ('description', 'task', true, 'Descrição', 'Descrição detalhada da tarefa'),
  ('due_date', 'task', true, 'Data de Entrega', 'Data limite para conclusão'),
  ('position', 'task', true, 'Posição', 'Posição da tarefa no projeto'),
  ('assignee_id', 'task', true, 'Responsável', 'ID do responsável pela tarefa'),
  ('completed', 'task', true, 'Concluída', 'Status de conclusão da tarefa'),
  ('priority', 'task', true, 'Prioridade', 'Nível de prioridade da tarefa'),
  ('archived', 'task', true, 'Arquivada', 'Status de arquivamento da tarefa'),
  ('created_at', 'task', true, 'Data de Criação', 'Data de criação da tarefa'),
  ('updated_at', 'task', true, 'Data de Atualização', 'Data da última atualização da tarefa');