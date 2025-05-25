/*
  # Add admin policy for user_roles table

  1. Changes
    - Add new RLS policy to allow administrators to view all user roles
    
  2. Security
    - Adds policy for administrators to read all user roles
    - Maintains existing policy for users to read their own roles
    - Ensures proper access control for role management functionality
*/

CREATE POLICY "Administrators can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.profile_id = auth.uid()
    AND r.name = 'admin'
  )
);