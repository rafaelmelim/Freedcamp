/*
  # Add task priority

  1. Changes
    - Add priority column to tasks table
    - Add priority enum type for task priorities
    - Set default priority to 'medium'

  2. Security
    - Maintain existing RLS policies
*/

-- Create priority enum type
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Add priority column to tasks table
ALTER TABLE tasks 
ADD COLUMN priority task_priority DEFAULT 'medium';

-- Update existing tasks to have medium priority
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- Make priority column not nullable
ALTER TABLE tasks 
ALTER COLUMN priority SET NOT NULL;