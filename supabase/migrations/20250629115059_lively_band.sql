/*
  # Add archived field to projects table

  1. Changes
    - Add `archived` boolean column to projects table with default false
    - Update existing projects to have archived = false

  2. Security
    - No changes to RLS policies needed
*/

-- Add archived column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Update existing projects to have archived = false
UPDATE projects SET archived = false WHERE archived IS NULL;

-- Make archived column not nullable
ALTER TABLE projects ALTER COLUMN archived SET NOT NULL;