-- Fix trainer email and contact info by pulling from reps table
-- Update existing trainers to use their rep contact information

UPDATE trainers 
SET 
  email = r.email,
  full_name = r.full_name,
  updated_at = now()
FROM reps r
WHERE trainers.user_id = r.user_id
  AND r.email IS NOT NULL 
  AND r.email != ''
  AND r.email NOT LIKE '%@example.com%';

-- Add columns for additional contact info that trainers should have from their rep days
ALTER TABLE trainers 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS birthday date;

-- Update trainer contact info from reps table
UPDATE trainers 
SET 
  phone = r.phone,
  address = r.address,
  birthday = r.birthday,
  updated_at = now()
FROM reps r
WHERE trainers.user_id = r.user_id;