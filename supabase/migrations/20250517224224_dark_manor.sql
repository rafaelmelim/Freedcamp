/*
  # Add completed field to tasks

  1. Changes
    - Add `completed` boolean column to tasks table with default value of false
    - Update existing tasks to have completed = false

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Update existing tasks to have completed = false
UPDATE tasks SET completed = false WHERE completed IS NULL;