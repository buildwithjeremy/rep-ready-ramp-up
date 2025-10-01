-- Add status column to trainers table
ALTER TABLE public.trainers 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Active';

-- Add check constraint to ensure valid status values
ALTER TABLE public.trainers 
ADD CONSTRAINT trainers_status_check 
CHECK (status IN ('Active', 'Inactive'));

-- Update get_trainers_for_signup to exclude inactive trainers
CREATE OR REPLACE FUNCTION public.get_trainers_for_signup()
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT t.user_id AS id, t.full_name
  FROM public.trainers t
  WHERE t.status = 'Active'
  ORDER BY t.full_name ASC;
$function$;

-- Update get_available_trainers to exclude inactive trainers
CREATE OR REPLACE FUNCTION public.get_available_trainers()
RETURNS TABLE(id uuid, full_name text, assigned_reps bigint)
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $function$
  SELECT 
    t.user_id as id,
    t.full_name,
    t.assigned_reps::bigint
  FROM trainers t
  WHERE 
    t.status = 'Active'
    AND (
      public.get_current_user_role() = 'ADMIN'
      OR 
      (public.get_current_user_role() = 'TRAINER' AND t.user_id = auth.uid())
    )
  ORDER BY t.assigned_reps ASC, t.full_name ASC;
$function$;

-- Add function to check if trainer has active reps
CREATE OR REPLACE FUNCTION public.trainer_has_active_reps(trainer_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.reps 
    WHERE trainer_id = trainer_user_id 
    AND status != 'Inactive'
  );
$function$;

-- Add function to archive/unarchive trainer (Admin only)
CREATE OR REPLACE FUNCTION public.update_trainer_status(
  target_trainer_id uuid,
  new_status text,
  admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_user_role user_role;
  trainer_name text;
  has_active_reps boolean;
BEGIN
  -- Only ADMINs can change trainer status
  SELECT role INTO current_user_role FROM public.profiles WHERE id = admin_user_id;
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can change trainer status';
  END IF;
  
  -- Get trainer name for audit log
  SELECT full_name INTO trainer_name
  FROM public.trainers
  WHERE user_id = target_trainer_id;
  
  IF trainer_name IS NULL THEN
    RAISE EXCEPTION 'Trainer not found';
  END IF;
  
  -- Check if trying to archive a trainer with active reps
  IF new_status = 'Inactive' THEN
    SELECT public.trainer_has_active_reps(target_trainer_id) INTO has_active_reps;
    IF has_active_reps THEN
      RAISE EXCEPTION 'Cannot archive trainer with active reps. Please reassign all reps first.';
    END IF;
  END IF;
  
  -- Update trainer status
  UPDATE public.trainers 
  SET 
    status = new_status,
    updated_at = now()
  WHERE user_id = target_trainer_id;
  
  -- Log the status change for audit purposes
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    admin_user_id,
    CASE 
      WHEN new_status = 'Inactive' THEN 'trainer_archived'
      ELSE 'trainer_reactivated'
    END,
    'trainers',
    target_trainer_id,
    jsonb_build_object('trainer_name', trainer_name),
    jsonb_build_object(
      'trainer_name', trainer_name,
      'new_status', new_status,
      'changed_by', admin_user_id
    )
  );
  
  RETURN true;
END;
$function$;