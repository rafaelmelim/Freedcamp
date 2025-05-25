/*
  # Update profiles table RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table
    - Add new policies for:
      - INSERT: Allow admins to create profiles or users to create their own profile
      - SELECT: Allow users to read their own profile
      - UPDATE: Allow users to update their own profile

  2. Security
    - Maintains row-level security
    - Ensures users can only access their own data
    - Allows admins to create new profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Allow admin to create profiles or users to create their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.profile_id = auth.uid()
      AND r.name = 'admin'
    ) OR auth.uid() = id
  );

CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);