/*
  # Fix database schema and setup

  1. Changes
    - Create sequence for labels and task_labels
    - Fix table definitions and constraints
    - Update policies
*/

-- Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS labels_id_seq;
CREATE SEQUENCE IF NOT EXISTS task_labels_id_seq;

-- Drop and recreate labels table with proper sequence
DROP TABLE IF EXISTS task_labels;
DROP TABLE IF EXISTS labels;

CREATE TABLE labels (
  id bigint PRIMARY KEY DEFAULT nextval('labels_id_seq'),
  name text NOT NULL,
  color text NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on name per owner
CREATE UNIQUE INDEX labels_name_owner_id_key ON labels (name, owner_id);

-- Enable RLS on labels
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Create policies for labels
CREATE POLICY "Users can create their own labels"
  ON labels
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view their own labels"
  ON labels
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own labels"
  ON labels
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own labels"
  ON labels
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create task_labels junction table
CREATE TABLE task_labels (
  id bigint PRIMARY KEY DEFAULT nextval('task_labels_id_seq'),
  task_id bigint REFERENCES tasks(id) ON DELETE CASCADE,
  label_id bigint REFERENCES labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for task-label pairs
CREATE UNIQUE INDEX task_labels_task_id_label_id_key ON task_labels (task_id, label_id);

-- Enable RLS on task_labels
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels
CREATE POLICY "Users can manage labels for their tasks"
  ON task_labels
  FOR ALL
  TO authenticated
  USING (
    task_id IN (
      SELECT tasks.id
      FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      WHERE projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    task_id IN (
      SELECT tasks.id
      FROM tasks
      JOIN projects ON tasks.project_id = projects.id
      WHERE projects.owner_id = auth.uid()
    )
  );