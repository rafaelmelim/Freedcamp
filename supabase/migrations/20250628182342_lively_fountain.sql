/*
  # Add Hours Tracking to Projects and Tasks

  1. Changes
    - Add actual_hours column to tasks table
    - Create function to calculate project actual hours
    - Create triggers to update project actual hours automatically

  2. Security
    - Maintain existing RLS policies
*/

-- Add actual_hours column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS actual_hours integer DEFAULT 0;

-- Create function to update project actual_hours
CREATE OR REPLACE FUNCTION update_project_actual_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE projects
    SET actual_hours = (
      SELECT COALESCE(SUM(actual_hours), 0) 
      FROM tasks 
      WHERE project_id = NEW.project_id AND archived = false
    )
    WHERE id = NEW.project_id;
    RETURN NEW;
  -- For DELETE
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET actual_hours = (
      SELECT COALESCE(SUM(actual_hours), 0) 
      FROM tasks 
      WHERE project_id = OLD.project_id AND archived = false
    )
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on tasks table for actual_hours
DROP TRIGGER IF EXISTS calculate_project_actual_hours_after_insert ON tasks;
CREATE TRIGGER calculate_project_actual_hours_after_insert
AFTER INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_hours();

DROP TRIGGER IF EXISTS calculate_project_actual_hours_after_update ON tasks;
CREATE TRIGGER calculate_project_actual_hours_after_update
AFTER UPDATE OF actual_hours, archived ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_hours();

DROP TRIGGER IF EXISTS calculate_project_actual_hours_after_delete ON tasks;
CREATE TRIGGER calculate_project_actual_hours_after_delete
AFTER DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_hours();

-- Update existing projects with calculated actual_hours
UPDATE projects
SET actual_hours = (
  SELECT COALESCE(SUM(actual_hours), 0)
  FROM tasks
  WHERE project_id = projects.id AND archived = false
);