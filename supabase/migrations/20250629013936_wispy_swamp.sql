/*
  # Remove parent_task_id column from tasks table

  1. Changes
    - Drop foreign key constraint for parent_task_id
    - Drop parent_task_id column from tasks table

  2. Security
    - No changes to RLS policies needed
*/

-- Drop foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_parent_task_id_fkey'
  ) THEN
    ALTER TABLE tasks DROP CONSTRAINT tasks_parent_task_id_fkey;
  END IF;
END $$;

-- Drop parent_task_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks DROP COLUMN parent_task_id;
  END IF;
END $$;