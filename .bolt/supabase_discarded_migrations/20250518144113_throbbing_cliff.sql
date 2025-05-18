/*
  # Create admin user

  1. Changes
    - Create admin user profile
    - Assign admin role
*/

-- Create profile for admin user
INSERT INTO public.profiles (id, name, email)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Admin User',
  'admin@example.com'
)
ON CONFLICT (id) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO public.user_roles (profile_id, role_id)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  r.id
FROM public.roles r
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;