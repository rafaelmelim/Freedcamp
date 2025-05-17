/*
  # Add task comments

  1. New Tables
    - `comments`
      - `id` (bigint, primary key)
      - `task_id` (bigint, foreign key to tasks)
      - `author_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on comments table
    - Add policies for CRUD operations
*/

-- Create sequence for comments
CREATE SEQUENCE IF NOT EXISTS comments_id_seq;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id bigint PRIMARY KEY DEFAULT nextval('comments_id_seq'),
  task_id bigint REFERENCES tasks(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  CREATE POLICY "Users can create comments on tasks in their projects"
    ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      task_id IN (
        SELECT tasks.id
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        WHERE projects.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view comments on tasks in their projects"
    ON comments
    FOR SELECT
    TO authenticated
    USING (
      task_id IN (
        SELECT tasks.id
        FROM tasks
        JOIN projects ON tasks.project_id = projects.id
        WHERE projects.owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own comments"
    ON comments
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own comments"
    ON comments
    FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;