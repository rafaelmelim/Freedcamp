/*
  # Create 10 admin users

  1. Changes
    - Create 10 admin users with profiles
    - Assign admin role to each user
    - Set up secure passwords
    - Create corresponding profiles

  2. Security
    - Uses secure password hashing
    - Maintains RLS policies
*/

DO $$
DECLARE
  admin_role_id bigint;
  new_user_id uuid;
  i integer;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';

  -- Create 10 admin users
  FOR i IN 1..10 LOOP
    -- Generate UUID for new user
    new_user_id := gen_random_uuid();
    
    -- Create user
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
      format('admin%s@example.com', i),
      crypt(format('Admin123!%s', i), gen_salt('bf')),
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

    -- Create identity
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
      format('{"sub":"%s","email":"%s"}', new_user_id::text, format('admin%s@example.com', i))::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    -- Create profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (new_user_id, format('admin%s@example.com', i), format('Admin User %s', i));

    -- Assign admin role
    INSERT INTO public.user_roles (profile_id, role_id)
    VALUES (new_user_id, admin_role_id);
  END LOOP;
END $$;