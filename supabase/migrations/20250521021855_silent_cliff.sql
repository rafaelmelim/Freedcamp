/*
  # Add unique constraint and reset password email template
  
  1. Changes
    - Add unique constraint on email_templates.type column
    - Insert default reset password email template
*/

-- First add a unique constraint on the type column
ALTER TABLE email_templates
ADD CONSTRAINT email_templates_type_key UNIQUE (type);

-- Then insert the reset password template
INSERT INTO email_templates (type, subject, body)
VALUES (
  'reset_password',
  'Reset Your Password',
  'Click the following link to reset your password: {{link}}'
) ON CONFLICT (type) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body;