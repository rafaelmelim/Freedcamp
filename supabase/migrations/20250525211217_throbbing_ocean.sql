/*
  # Update admin user password

  Updates the password for the admin@example.com user to '123456'
*/

DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID from auth.users table
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@example.com';

  -- Update the password if user exists
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt('123456', gen_salt('bf'))
    WHERE id = v_user_id;
  END IF;
END $$;