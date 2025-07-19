-- Add birthday column to reps table
ALTER TABLE public.reps 
ADD COLUMN birthday DATE;

-- Update existing reps to have null birthday (optional field)
-- No action needed as new column defaults to null

-- Add constraint to ensure birthday is reasonable (optional but good practice)
ALTER TABLE public.reps 
ADD CONSTRAINT birthday_reasonable 
CHECK (birthday IS NULL OR (birthday >= '1900-01-01' AND birthday <= CURRENT_DATE));