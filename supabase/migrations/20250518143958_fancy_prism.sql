/*
  # Set up authentication schema and tables

  1. Changes
    - Create auth schema if it doesn't exist
    - Create required auth tables and functions
    - Set up initial admin user
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone text,
  phone_confirmed_at timestamptz,
  phone_change text,
  phone_change_token text,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token text,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz
);

-- Create auth.identities table
CREATE TABLE IF NOT EXISTS auth.identities (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  identity_data jsonb NOT NULL,
  provider text NOT NULL,
  last_sign_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  email text GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED
);

-- Create auth.instances table
CREATE TABLE IF NOT EXISTS auth.instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid uuid,
  raw_base_config text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auth.refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  token text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  revoked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  parent text
);

-- Create auth.mfa_factors table
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friendly_name text,
  factor_type auth.factor_type NOT NULL,
  status auth.factor_status NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  secret text
);

-- Create auth.mfa_challenges table
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_id uuid NOT NULL REFERENCES auth.mfa_factors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  ip_address inet NOT NULL
);

-- Create auth.mfa_amr_claims table
CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  authentication_method text NOT NULL,
  CONSTRAINT session_auth_method_pkey UNIQUE (session_id, authentication_method)
);

-- Create auth.flow_state table
CREATE TABLE IF NOT EXISTS auth.flow_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_code text NOT NULL,
  code_challenge_method auth.code_challenge_method NOT NULL,
  code_challenge text NOT NULL,
  provider_type text NOT NULL,
  provider_access_token text,
  provider_refresh_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  authentication_method text NOT NULL
);

-- Create auth.sso_providers table
CREATE TABLE IF NOT EXISTS auth.sso_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auth.sso_domains table
CREATE TABLE IF NOT EXISTS auth.sso_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_provider_id uuid NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
  domain text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT sso_domains_domain_key UNIQUE (domain)
);

-- Create auth.saml_providers table
CREATE TABLE IF NOT EXISTS auth.saml_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_provider_id uuid NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
  entity_id text NOT NULL UNIQUE,
  metadata_xml text NOT NULL,
  metadata_url text,
  attribute_mapping jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auth.saml_relay_states table
CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_provider_id uuid NOT NULL REFERENCES auth.sso_providers(id) ON DELETE CASCADE,
  request_id text NOT NULL,
  for_email text,
  redirect_to text,
  from_ip_address inet,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create auth.sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  factor_id uuid REFERENCES auth.mfa_factors(id) ON DELETE CASCADE,
  aal auth.aal_level,
  not_after timestamptz
);

-- Create initial admin user
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  instance_id,
  email_change_confirm_status,
  is_super_admin
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
  '',
  '00000000-0000-0000-0000-000000000000',
  0,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Create identity for admin user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid()::text,
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  now(),
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@example.com'
ON CONFLICT DO NOTHING;

-- Create profile for admin user
INSERT INTO public.profiles (id, email, name)
SELECT 
  id,
  email,
  'Admin User'
FROM auth.users 
WHERE email = 'admin@example.com'
ON CONFLICT DO NOTHING;

-- Assign admin role to admin user
INSERT INTO public.user_roles (profile_id, role_id)
SELECT 
  u.id,
  r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = 'admin@example.com'
AND r.name = 'admin'
ON CONFLICT DO NOTHING;