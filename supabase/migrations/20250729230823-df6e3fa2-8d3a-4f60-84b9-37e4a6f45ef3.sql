-- Fix Jim and Julie's issues

-- 1. Update their roles to ADMIN (they should be both ADMIN and TRAINER)
UPDATE profiles 
SET role = 'ADMIN'
WHERE id IN ('f7ba0681-b3e3-4f22-ba3f-8e3f8fb8aada', 'cc2b22ad-25e9-4def-a9ee-d97905185c58');

-- 2. Create trainer records for them
INSERT INTO trainers (user_id, full_name, email, assigned_reps, active_reps, independent_reps, stuck_reps, success_rate, average_time_to_independent)
SELECT 
  p.id,
  p.full_name,
  p.id::text || '@teamtenacious.com', -- placeholder email
  0, 0, 0, 0, 0, 0
FROM profiles p
WHERE p.id IN ('f7ba0681-b3e3-4f22-ba3f-8e3f8fb8aada', 'cc2b22ad-25e9-4def-a9ee-d97905185c58')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Mark ALL their subtasks as completed (since you said you completed everything)
UPDATE milestone_subtasks 
SET 
  completed = true,
  completed_at = now(),
  completed_by = '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a' -- your admin ID
WHERE milestone_id IN (
  SELECT m.id 
  FROM milestones m
  JOIN reps r ON r.id = m.rep_id
  WHERE r.user_id IN ('f7ba0681-b3e3-4f22-ba3f-8e3f8fb8aada', 'cc2b22ad-25e9-4def-a9ee-d97905185c58')
);

-- 4. Update their rep status to Independent and set progress to 100%
UPDATE reps 
SET 
  status = 'Independent',
  overall_progress = 100,
  promotion_date = COALESCE(promotion_date, now()),
  last_activity = now()
WHERE user_id IN ('f7ba0681-b3e3-4f22-ba3f-8e3f8fb8aada', 'cc2b22ad-25e9-4def-a9ee-d97905185c58');