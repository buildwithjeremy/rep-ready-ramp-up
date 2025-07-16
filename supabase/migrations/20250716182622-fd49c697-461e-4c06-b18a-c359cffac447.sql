-- Phase 1: Fix user registration to default to REP role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'REP'  -- Default new users to REP role
  );
  RETURN NEW;
END;
$$;

-- Phase 2: Update reps table to link to user accounts
ALTER TABLE public.reps ADD COLUMN user_id uuid REFERENCES public.profiles(id);

-- Create index for better performance
CREATE INDEX idx_reps_user_id ON public.reps(user_id);

-- Phase 3: Add helper function to get trainer options for new rep assignment
CREATE OR REPLACE FUNCTION public.get_available_trainers()
RETURNS TABLE(id uuid, full_name text, assigned_reps bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.full_name,
    COUNT(r.id) as assigned_reps
  FROM profiles p
  LEFT JOIN reps r ON r.trainer_id = p.id
  WHERE p.role = 'TRAINER'
  GROUP BY p.id, p.full_name
  ORDER BY assigned_reps ASC, p.full_name ASC;
$$;

-- Phase 4: Add function to promote user roles with business rule validation
CREATE OR REPLACE FUNCTION public.promote_user_role(
  target_user_id uuid,
  new_role user_role,
  promoted_by_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role user_role;
  target_user_current_role user_role;
  rep_progress integer;
BEGIN
  -- Only ADMINs can promote users
  SELECT role INTO current_user_role FROM profiles WHERE id = promoted_by_user_id;
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can promote users';
  END IF;
  
  -- Get current role of target user
  SELECT role INTO target_user_current_role FROM profiles WHERE id = target_user_id;
  IF target_user_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Business rule validation for TRAINER promotion
  IF new_role = 'TRAINER' AND target_user_current_role != 'TRAINER' THEN
    -- Check if user was ever a rep and completed the journey
    SELECT r.overall_progress INTO rep_progress 
    FROM reps r 
    WHERE r.user_id = target_user_id 
    AND r.status = 'Independent'
    LIMIT 1;
    
    IF rep_progress IS NULL OR rep_progress < 100 THEN
      RAISE EXCEPTION 'User must complete the full rep journey (Independent status) before becoming a trainer';
    END IF;
  END IF;
  
  -- Update the role
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
  
  -- If promoting to TRAINER, create trainer record
  IF new_role = 'TRAINER' AND target_user_current_role != 'TRAINER' THEN
    INSERT INTO trainers (user_id, full_name, email)
    SELECT id, full_name, id::text || '@example.com' -- Placeholder email, should be updated
    FROM profiles 
    WHERE id = target_user_id;
  END IF;
  
  RETURN true;
END;
$$;