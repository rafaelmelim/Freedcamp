-- Create admin user if it doesn't exist
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Insert into auth.users with UUID
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      aud,
      role
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      'authenticated',
      'authenticated'
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at,
      last_sign_in_at
    )
    VALUES (
      new_user_id,
      new_user_id::text,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@example.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    -- Create profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (new_user_id, 'admin@example.com', 'Admin User');

    -- Assign admin role
    INSERT INTO public.user_roles (profile_id, role_id)
    SELECT new_user_id, id
    FROM public.roles
    WHERE name = 'admin';
  END IF;
END $$;