/*
  # Fix user_roles policies to prevent recursion

  1. Changes
    - Drop existing policies on user_roles table
    - Create new simplified policies that prevent infinite recursion
    - Add separate policies for different operations (SELECT, INSERT, UPDATE, DELETE)
    
  2. Security
    - Maintain security by ensuring users can only:
      - Read their own roles
      - Admins can manage all roles (checked via roles table directly)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;

-- Create new policies that prevent recursion
CREATE POLICY "Users can read own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.name = 'admin'
      AND r.id IN (
        SELECT role_id
        FROM user_roles
        WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.name = 'admin'
      AND r.id IN (
        SELECT role_id
        FROM user_roles
        WHERE profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.name = 'admin'
      AND r.id IN (
        SELECT role_id
        FROM user_roles
        WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM roles r
      WHERE r.name = 'admin'
      AND r.id IN (
        SELECT role_id
        FROM user_roles
        WHERE profile_id = auth.uid()
      )
    )
  );