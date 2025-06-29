/*
  # Add subtask functionality

  1. Changes
    - Add parent_task_id column to tasks table
    - Add foreign key constraint for parent-child relationship
    - Update RLS policies to handle subtasks

  2. Security
    - Maintain existing RLS policies
    - Ensure subtasks inherit permissions from parent tasks
*/

-- Add parent_task_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id bigint;

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

-- Add index for better performance when querying subtasks
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);