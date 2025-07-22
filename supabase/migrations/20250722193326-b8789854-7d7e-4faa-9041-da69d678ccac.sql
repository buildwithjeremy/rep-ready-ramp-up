-- Create a comprehensive user cleanup function
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Only ADMINs can delete users
  SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- Delete in correct order to maintain referential integrity
  
  -- 1. Delete milestone subtasks first
  DELETE FROM milestone_subtasks ms
  WHERE ms.milestone_id IN (
    SELECT m.id FROM milestones m
    JOIN reps r ON r.id = m.rep_id
    WHERE r.user_id = target_user_id
  );
  
  -- 2. Delete milestones
  DELETE FROM milestones m
  WHERE m.rep_id IN (
    SELECT r.id FROM reps r WHERE r.user_id = target_user_id
  );
  
  -- 3. Delete reps
  DELETE FROM reps WHERE user_id = target_user_id;
  
  -- 4. Delete trainer record if exists
  DELETE FROM trainers WHERE user_id = target_user_id;
  
  -- 5. Delete from profiles (this will cascade to auth.users)
  DELETE FROM profiles WHERE id = target_user_id;
  
  -- 6. Delete from auth.users using admin API (this requires service role)
  -- Note: This step requires the application to call Supabase Admin API
  
  RETURN true;
END;
$$;