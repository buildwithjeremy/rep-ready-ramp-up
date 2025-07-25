-- Create function to reassign reps to different trainers
CREATE OR REPLACE FUNCTION public.reassign_rep_to_trainer(
  target_rep_id uuid,
  new_trainer_id uuid,
  admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role user_role;
  old_trainer_id uuid;
  rep_name text;
  old_trainer_name text;
  new_trainer_name text;
BEGIN
  -- Only ADMINs can reassign reps
  SELECT role INTO current_user_role FROM public.profiles WHERE id = admin_user_id;
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can reassign reps';
  END IF;
  
  -- Get current rep and trainer information for audit log
  SELECT r.trainer_id, r.full_name INTO old_trainer_id, rep_name
  FROM public.reps r
  WHERE r.id = target_rep_id;
  
  IF old_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Rep not found';
  END IF;
  
  -- Get trainer names for audit log
  SELECT t.full_name INTO old_trainer_name
  FROM public.trainers t
  WHERE t.user_id = old_trainer_id;
  
  SELECT t.full_name INTO new_trainer_name
  FROM public.trainers t
  WHERE t.user_id = new_trainer_id;
  
  IF new_trainer_name IS NULL THEN
    RAISE EXCEPTION 'New trainer not found';
  END IF;
  
  -- Update the rep's trainer assignment
  UPDATE public.reps 
  SET 
    trainer_id = new_trainer_id,
    updated_at = now(),
    last_activity = now()  -- Reset last activity since this is an admin action
  WHERE id = target_rep_id;
  
  -- Log the reassignment for audit purposes
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    admin_user_id,
    'rep_reassignment',
    'reps',
    target_rep_id,
    jsonb_build_object(
      'rep_name', rep_name,
      'old_trainer_id', old_trainer_id,
      'old_trainer_name', old_trainer_name
    ),
    jsonb_build_object(
      'rep_name', rep_name,
      'new_trainer_id', new_trainer_id,
      'new_trainer_name', new_trainer_name,
      'reassigned_by', admin_user_id
    )
  );
  
  RETURN true;
END;
$function$;