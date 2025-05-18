/*
  # Add admin user

  1. Changes
    - Create admin user with email/password
    - Assign admin role to the user
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    )
    VALUES (
      'admin@example.com',
      crypt('admin', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id::text,
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@example.com')::jsonb,
      'email',
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