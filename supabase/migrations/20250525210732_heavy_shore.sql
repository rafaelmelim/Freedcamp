/*
  # Assign admin role to admin user

  1. Changes
    - Assigns the admin role to the user with email admin@example.com
    - Creates the admin role if it doesn't exist
    - Creates the user role association

  2. Security
    - No changes to existing security policies
*/

-- First ensure the admin role exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin') THEN
    INSERT INTO roles (name, description)
    VALUES ('admin', 'Administrator with full system access');
  END IF;
END $$;

-- Then assign the admin role to the user
DO $$ 
DECLARE
  v_user_id uuid;
  v_role_id bigint;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = 'admin@example.com';

  -- Get the admin role ID
  SELECT id INTO v_role_id
  FROM roles
  WHERE name = 'admin';

  -- If both exist, create the association if it doesn't already exist
  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO user_roles (profile_id, role_id)
    VALUES (v_user_id, v_role_id)
    ON CONFLICT (profile_id, role_id) DO NOTHING;
  END IF;
END $$;