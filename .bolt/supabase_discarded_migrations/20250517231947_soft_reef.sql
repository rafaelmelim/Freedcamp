/*
  # Add task labels feature

  1. New Tables
    - `labels`
      - `id` (bigint, primary key)
      - `name` (text, unique)
      - `color` (text)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamp)
    - `task_labels`
      - `id` (bigint, primary key)
      - `task_id` (bigint, references tasks)
      - `label_id` (bigint, references labels)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their labels
    - Add policies for task label associations
*/

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id bigint PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS task_labels (
  id bigint PRIMARY KEY,
  task_id bigint REFERENCES tasks(id) ON DELETE CASCADE,
  label_id bigint REFERENCES labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, label_id)
);

-- Enable RLS on task_labels
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Create policies for task_labels
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