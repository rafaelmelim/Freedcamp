/*
  # Add task value and project total calculation

  1. Changes
    - Add value column to tasks table
    - Create function to update project actual_value automatically
    - Create triggers to recalculate project totals when tasks change

  2. Security
    - Maintain existing RLS policies
*/

-- Add value column to tasks table
ALTER TABLE tasks
ADD COLUMN value numeric(10,2) DEFAULT 0;

-- Create function to update project actual_value
CREATE OR REPLACE FUNCTION update_project_actual_value()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE projects
    SET actual_value = (SELECT COALESCE(SUM(value), 0) FROM tasks WHERE project_id = NEW.project_id AND archived = false)
    WHERE id = NEW.project_id;
    RETURN NEW;
  -- For DELETE
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects
    SET actual_value = (SELECT COALESCE(SUM(value), 0) FROM tasks WHERE project_id = OLD.project_id AND archived = false)
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on tasks table
DROP TRIGGER IF EXISTS calculate_project_actual_value_after_insert ON tasks;
CREATE TRIGGER calculate_project_actual_value_after_insert
AFTER INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_value();

DROP TRIGGER IF EXISTS calculate_project_actual_value_after_update ON tasks;
CREATE TRIGGER calculate_project_actual_value_after_update
AFTER UPDATE OF value, archived ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_value();

DROP TRIGGER IF EXISTS calculate_project_actual_value_after_delete ON tasks;
CREATE TRIGGER calculate_project_actual_value_after_delete
AFTER DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_actual_value();

-- Update existing projects with calculated actual_value
UPDATE projects
SET actual_value = (
  SELECT COALESCE(SUM(value), 0)
  FROM tasks
  WHERE project_id = projects.id AND archived = false
);