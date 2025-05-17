/*
  # Add labels and task labels tables

  1. New Tables
    - `labels`
      - `id` (bigint, primary key)
      - `name` (text, not null)
      - `color` (text, not null)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamptz)
    - `task_labels`
      - `id` (bigint, primary key)
      - `task_id` (bigint, references tasks)
      - `label_id` (bigint, references labels)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for label management
    - Add policies for task label management
*/

-- Create sequence for labels
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS labels_id_seq;
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, sequence already exists
END $$;

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id bigint PRIMARY KEY DEFAULT nextval('labels_id_seq'),
  name text NOT NULL,
  color text NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint on name per owner
CREATE UNIQUE INDEX IF NOT EXISTS labels_name_owner_id_key ON labels (name, owner_id);

-- Enable RLS on labels
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Create policies for labels
DO $$ BEGIN
  CREATE POLICY "Users can create their own labels"
    ON labels
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, policy already exists
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own labels"
    ON labels
    FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, policy already exists
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own labels"
    ON labels
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, policy already exists
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own labels"
    ON labels
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, policy already exists
END $$;

-- Create sequence for task_labels
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS task_labels_id_seq;
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, sequence already exists
END $$;

-- Create task_labels junction table
CREATE TABLE IF NOT EXISTS task_labels (
  id bigint PRIMARY KEY DEFAULT nextval('task_labels_id_seq'),
  task_id bigint REFERENCES tasks(id) ON DELETE CASCADE,
  label_id bigint REFERENCES labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint for task-label pairs
CREATE UNIQUE INDEX IF NOT EXISTS task_labels_task_id_label_id_key ON task_labels (task_id, label_id);

-- Enable RLS on task_labels
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing, policy already exists
END $$;