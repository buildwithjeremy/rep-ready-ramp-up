-- Clean up jeremy@neversettle.org user data and orphaned records

-- First, delete milestone subtasks for any milestones belonging to reps owned by this user
DELETE FROM milestone_subtasks 
WHERE milestone_id IN (
  SELECT m.id FROM milestones m 
  JOIN reps r ON r.id = m.rep_id 
  WHERE r.user_id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032'
);

-- Delete milestones for reps owned by this user
DELETE FROM milestones 
WHERE rep_id IN (
  SELECT id FROM reps WHERE user_id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032'
);

-- Delete rep records for this user
DELETE FROM reps WHERE user_id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032';

-- Delete the profile for this user
DELETE FROM profiles WHERE id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032';

-- Clean up any orphaned milestone_subtasks (not connected to valid milestones)
DELETE FROM milestone_subtasks 
WHERE NOT EXISTS (
  SELECT 1 FROM milestones WHERE milestones.id = milestone_subtasks.milestone_id
);

-- Clean up any orphaned milestones (not connected to valid reps)
DELETE FROM milestones 
WHERE NOT EXISTS (
  SELECT 1 FROM reps WHERE reps.id = milestones.rep_id
);

-- Clean up any orphaned reps (user_id not in profiles or auth.users)
DELETE FROM reps 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = reps.user_id
);

-- Clean up any profiles without corresponding auth users
DELETE FROM profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE auth.users.id = profiles.id
);

-- Update trainer stats after cleanup
UPDATE trainers 
SET 
  assigned_reps = (
    SELECT COUNT(*) FROM reps 
    WHERE trainer_id = trainers.user_id
  ),
  active_reps = (
    SELECT COUNT(*) FROM reps 
    WHERE trainer_id = trainers.user_id AND status = 'Active'
  ),
  independent_reps = (
    SELECT COUNT(*) FROM reps 
    WHERE trainer_id = trainers.user_id AND status = 'Independent'
  ),
  stuck_reps = (
    SELECT get_stuck_reps_count(trainers.user_id)
  ),
  success_rate = (
    SELECT get_conversion_rate(trainers.user_id)
  ),
  average_time_to_independent = (
    SELECT get_avg_time_to_independent(trainers.user_id)
  ),
  updated_at = now();