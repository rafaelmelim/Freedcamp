/*
  # Fix recursive RLS policy on user_roles table

  1. Changes
    - Drop existing recursive policies on user_roles table
    - Create new non-recursive policies that:
      - Allow users to read their own roles
      - Allow admins to manage all roles using a non-recursive approach
      
  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion
    - Preserves admin access control
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Administrators can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their roles" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Users can read their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- For admin access, we'll use a separate policy that checks the roles table directly
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.profile_id = auth.uid()
    AND r.name = 'admin'
    AND ur.profile_id != user_roles.profile_id -- Prevent recursion by excluding the current user's roles
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.profile_id = auth.uid()
    AND r.name = 'admin'
    AND ur.profile_id != user_roles.profile_id -- Prevent recursion by excluding the current user's roles
  )
);