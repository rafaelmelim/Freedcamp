/*
  # Add new project fields
  
  1. Changes
    - Add estimated_value (decimal)
    - Add actual_value (decimal)
    - Add estimated_end_date (date)
    - Add actual_end_date (date)
    - Add analyst (text)
    - Add description (text)
    - Add estimated_hours (integer)
    - Add actual_hours (integer)
*/

ALTER TABLE projects
ADD COLUMN estimated_value decimal(10,2),
ADD COLUMN actual_value decimal(10,2),
ADD COLUMN estimated_end_date date,
ADD COLUMN actual_end_date date,
ADD COLUMN analyst text,
ADD COLUMN description text,
ADD COLUMN estimated_hours integer,
ADD COLUMN actual_hours integer;