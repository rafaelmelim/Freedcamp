/*
  # Add Role-Based Access Control Tables

  1. New Tables
    - `roles`
      - `id` (bigint, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
    - `user_roles`
      - `id` (bigint, primary key)
      - `profile_id` (uuid, references profiles)
      - `role_id` (bigint, references roles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create roles table
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

-- Create user_roles table
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

-- Insert default roles
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrator with full access'),
  ('user', 'Regular user with standard access')
ON CONFLICT (name) DO NOTHING;