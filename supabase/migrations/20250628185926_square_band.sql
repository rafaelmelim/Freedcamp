-- Update actual_hours column to store seconds instead of hours
-- This migration ensures all time values are stored in seconds for precision

-- Update the function to work with seconds
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

-- Update existing projects with calculated actual_hours in seconds
UPDATE projects
SET actual_hours = (
  SELECT COALESCE(SUM(actual_hours), 0)
  FROM tasks
  WHERE project_id = projects.id AND archived = false
);