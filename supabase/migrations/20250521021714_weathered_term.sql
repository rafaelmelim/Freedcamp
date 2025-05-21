/*
  # Create reset password email template

  1. New Data
    - Creates default reset password email template
*/

INSERT INTO email_templates (type, subject, body)
VALUES (
  'reset_password',
  'Reset Your Password',
  'Click the following link to reset your password: {{link}}'
) ON CONFLICT (type) DO NOTHING;