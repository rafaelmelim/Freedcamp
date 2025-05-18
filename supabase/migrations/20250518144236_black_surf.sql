-- Assign admin role to admin user
INSERT INTO public.user_roles (profile_id, role_id)
SELECT 
  p.id,
  r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email = 'admin@example.com'
AND r.name = 'admin'
ON CONFLICT DO NOTHING;