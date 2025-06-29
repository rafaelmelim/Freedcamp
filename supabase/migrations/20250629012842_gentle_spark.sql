/*
  # Add parent_task_id column to tasks table

  1. Changes
    - Add `parent_task_id` column to `tasks` table
    - Set up foreign key constraint to reference parent tasks
    - Allow null values for top-level tasks

  2. Security
    - No changes to RLS policies needed as parent_task_id follows same ownership rules
*/

-- Add parent_task_id column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN parent_task_id bigint;
  END IF;
END $$;

-- Add foreign key constraint to ensure parent_task_id references valid tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_parent_task_id_fkey'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT tasks_parent_task_id_fkey 
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
  END IF;
END $$;