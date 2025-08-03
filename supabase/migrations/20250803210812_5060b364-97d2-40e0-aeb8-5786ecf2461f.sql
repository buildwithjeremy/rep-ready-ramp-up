-- Fix all reps that should be stuck but aren't marked as such
UPDATE reps 
SET status = 'Stuck'
WHERE EXTRACT(EPOCH FROM (now() - last_activity)) / 3600 >= 48 
AND status = 'Active'
AND status != 'Independent';