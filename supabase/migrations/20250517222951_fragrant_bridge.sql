/*
  # Initial Schema Setup for Freedcamp Clone

  1. New Tables
    - `profiles` - User profiles and settings
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `roles` - User roles/profiles for access control
      - `id` (bigint, primary key)
      - `name` (text)
      - `description` (text)
      - `created_at` (timestamptz)

    - `user_roles` - Junction table for user-role assignments
      - `id` (bigint, primary key)
      - `profile_id` (uuid, references profiles)
      - `role_id` (bigint, references roles)
      - `created_at` (timestamptz)

    - `projects` - Project information
      - `id` (bigint, primary key)
      - `title` (text)
      - `position` (integer)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tasks` - Tasks within projects
      - `id` (bigint, primary key)
      - `project_id` (bigint, references projects)
      - `title` (text)
      - `description` (text)
      - `due_date` (date)
      - `position` (integer)
      - `assignee_id` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE profiles IS 'Tabela de perfis de usuários';
COMMENT ON COLUMN profiles.id IS 'ID único do perfil';
COMMENT ON COLUMN profiles.name IS 'Nome do usuário';
COMMENT ON COLUMN profiles.email IS 'E-mail do usuário';
COMMENT ON COLUMN profiles.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN profiles.updated_at IS 'Data de atualização do registro';

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'Tabela de perfis de acesso';
COMMENT ON COLUMN roles.id IS 'ID sequencial do perfil';
COMMENT ON COLUMN roles.name IS 'Nome do perfil';
COMMENT ON COLUMN roles.description IS 'Descrição do perfil';
COMMENT ON COLUMN roles.created_at IS 'Data de criação do registro';

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id bigint REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Tabela de associação entre usuários e perfis';
COMMENT ON COLUMN user_roles.id IS 'ID sequencial da associação';
COMMENT ON COLUMN user_roles.profile_id IS 'ID do perfil do usuário';
COMMENT ON COLUMN user_roles.role_id IS 'ID do perfil de acesso';
COMMENT ON COLUMN user_roles.created_at IS 'Data de criação do registro';

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE projects IS 'Tabela de projetos';
COMMENT ON COLUMN projects.id IS 'ID sequencial do projeto';
COMMENT ON COLUMN projects.title IS 'Título do projeto';
COMMENT ON COLUMN projects.position IS 'Posição do projeto no board';
COMMENT ON COLUMN projects.owner_id IS 'ID do proprietário do projeto';
COMMENT ON COLUMN projects.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN projects.updated_at IS 'Data de atualização do registro';

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  project_id bigint REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  position integer NOT NULL DEFAULT 0,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tasks IS 'Tabela de tarefas';
COMMENT ON COLUMN tasks.id IS 'ID sequencial da tarefa';
COMMENT ON COLUMN tasks.project_id IS 'ID do projeto';
COMMENT ON COLUMN tasks.title IS 'Título da tarefa';
COMMENT ON COLUMN tasks.description IS 'Descrição da tarefa';
COMMENT ON COLUMN tasks.due_date IS 'Data de entrega';
COMMENT ON COLUMN tasks.position IS 'Posição da tarefa no projeto';
COMMENT ON COLUMN tasks.assignee_id IS 'ID do responsável pela tarefa';
COMMENT ON COLUMN tasks.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN tasks.updated_at IS 'Data de atualização do registro';

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read all roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can read their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can read tasks in their projects"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their projects"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their projects"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their projects"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin role
INSERT INTO roles (name, description)
VALUES ('admin', 'Administrador do sistema com acesso total')
ON CONFLICT (name) DO NOTHING;