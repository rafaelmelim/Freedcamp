/*
  # Create users table in public schema
  
  1. Changes
    - Create users table in public schema instead of auth schema
    - Add necessary columns for user management
    - Enable RLS and add policies
    - Add foreign key relationship with profiles table

  2. Security
    - Enable RLS on users table
    - Add policies for users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  confirmed_at timestamptz,
  confirmation_token text,
  reset_password_token text,
  reset_password_sent_at timestamptz
);

-- Add comments
COMMENT ON TABLE public.users IS 'User accounts for authentication';
COMMENT ON COLUMN public.users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN public.users.email IS 'User email address';
COMMENT ON COLUMN public.users.encrypted_password IS 'Encrypted user password';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the user was last updated';
COMMENT ON COLUMN public.users.last_sign_in_at IS 'Timestamp of last user sign in';
COMMENT ON COLUMN public.users.confirmed_at IS 'Timestamp when the user confirmed their email';
COMMENT ON COLUMN public.users.confirmation_token IS 'Token for email confirmation';
COMMENT ON COLUMN public.users.reset_password_token IS 'Token for password reset';
COMMENT ON COLUMN public.users.reset_password_sent_at IS 'Timestamp when password reset was sent';

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES public.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;