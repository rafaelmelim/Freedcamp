/*
  # Add Role-Based Access Control

  1. Changes
    - Add roles table for storing user roles (admin, user)
    - Add user_roles table for role assignments
    - Insert default roles

  2. Security
    - Enable RLS on both tables
    - Add policies for role access
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read all roles" ON roles;
  DROP POLICY IF EXISTS "Users can read their roles" ON user_roles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id bigint REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Insert default roles if they don't exist
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrator with full access'),
  ('user', 'Regular user with standard access')
ON CONFLICT (name) DO NOTHING;