-- Fix the security definer function by ensuring proper search path
CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Only ADMINs can delete users
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  
  -- Delete in correct order to maintain referential integrity
  
  -- 1. Delete milestone subtasks first
  DELETE FROM public.milestone_subtasks ms
  WHERE ms.milestone_id IN (
    SELECT m.id FROM public.milestones m
    JOIN public.reps r ON r.id = m.rep_id
    WHERE r.user_id = target_user_id
  );
  
  -- 2. Delete milestones
  DELETE FROM public.milestones m
  WHERE m.rep_id IN (
    SELECT r.id FROM public.reps r WHERE r.user_id = target_user_id
  );
  
  -- 3. Delete reps
  DELETE FROM public.reps WHERE user_id = target_user_id;
  
  -- 4. Delete trainer record if exists
  DELETE FROM public.trainers WHERE user_id = target_user_id;
  
  -- 5. Delete from profiles
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  RETURN true;
END;
$$;