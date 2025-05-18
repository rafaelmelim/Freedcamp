/*
  # Add users table for Supabase Auth

  1. New Tables
    - `users` (auth.users)
      - `id` (uuid, primary key)
      - `instance_id` (uuid)
      - `email` (text)
      - `encrypted_password` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_sign_in_at` (timestamptz)
      - `raw_app_meta_data` (jsonb)
      - `raw_user_meta_data` (jsonb)
      - `is_super_admin` (boolean)
      - `confirmed_at` (timestamptz)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid,
  email text,
  encrypted_password text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  confirmed_at timestamptz,
  email_confirmed_at timestamptz,
  confirmation_token text,
  confirmation_sent_at timestamptz,
  recovery_token text,
  recovery_sent_at timestamptz,
  email_change_token_new text,
  email_change text,
  email_change_sent_at timestamptz,
  last_sign_in_ip text,
  CONSTRAINT users_email_key UNIQUE (email)
);

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);