/*
  # Add archive status to tasks

  1. Changes
    - Add `archived` boolean column to tasks table with default false
    - Update RLS policies to include archived status in conditions
*/

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;

-- Update existing policies to exclude archived tasks by default
DROP POLICY IF EXISTS "Users can read tasks in their projects" ON tasks;
CREATE POLICY "Users can read tasks in their projects"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update tasks in their projects" ON tasks;
CREATE POLICY "Users can update tasks in their projects"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT projects.id
      FROM projects
      WHERE projects.owner_id = auth.uid()
    )
  );