/*
  # Create admin user and assign role

  1. Changes
    - Insert admin user into profiles table if not exists
    - Assign admin role to the user
    
  2. Security
    - No changes to RLS policies needed
*/

-- First check if the admin user already exists to avoid email conflict
DO $$
DECLARE
  admin_id uuid := '00000000-0000-0000-0000-000000000000';
  admin_role_id bigint;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  
  -- Only insert if the admin user doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@example.com') THEN
    -- Insert admin profile
    INSERT INTO public.profiles (id, name, email)
    VALUES (admin_id, 'Admin User', 'admin@example.com');
    
    -- Assign admin role
    INSERT INTO public.user_roles (profile_id, role_id)
    VALUES (admin_id, admin_role_id);
  END IF;
END $$;