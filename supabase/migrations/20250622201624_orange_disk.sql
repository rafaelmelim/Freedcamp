/*
  # Add task status field

  1. Changes
    - Add status column to tasks table with enum type
    - Set default status to 'nao_iniciada'
    - Update existing tasks to have appropriate status based on completed field

  2. Security
    - Maintain existing RLS policies
*/

-- Create task status enum type
CREATE TYPE task_status AS ENUM ('concluida', 'em_andamento', 'nao_iniciada');

-- Add status column to tasks table
ALTER TABLE tasks 
ADD COLUMN status task_status DEFAULT 'nao_iniciada';

-- Update existing tasks to have appropriate status based on completed field
UPDATE tasks 
SET status = CASE 
  WHEN completed = true THEN 'concluida'::task_status
  ELSE 'nao_iniciada'::task_status
END;

-- Make status column not nullable
ALTER TABLE tasks 
ALTER COLUMN status SET NOT NULL;