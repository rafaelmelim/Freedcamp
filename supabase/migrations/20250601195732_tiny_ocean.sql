/*
  # Add Project Sequence Number

  1. Changes
    - Add sequence_number column to projects table
    - Create trigger to auto-generate sequence numbers
    - Add unique constraint on sequence_number
    - Update existing projects with sequence numbers
*/

-- Add sequence_number column
ALTER TABLE projects
ADD COLUMN sequence_number bigint;

-- Create sequence for project numbers
CREATE SEQUENCE IF NOT EXISTS project_sequence_seq;

-- Update existing projects with sequence numbers
UPDATE projects
SET sequence_number = nextval('project_sequence_seq')
WHERE sequence_number IS NULL;

-- Make sequence_number not null and unique
ALTER TABLE projects
ALTER COLUMN sequence_number SET NOT NULL,
ADD CONSTRAINT projects_sequence_number_key UNIQUE (sequence_number);

-- Create function to set sequence number
CREATE OR REPLACE FUNCTION set_project_sequence_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sequence_number IS NULL THEN
    NEW.sequence_number := nextval('project_sequence_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set sequence number
CREATE TRIGGER set_project_sequence_number_trigger
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_project_sequence_number();