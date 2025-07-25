-- Phase 1: Critical Database Security Fixes (Fixed)

-- 1. Recreate admin_dashboard_metrics view without SECURITY DEFINER (views don't support this)
DROP VIEW IF EXISTS public.admin_dashboard_metrics;

CREATE VIEW public.admin_dashboard_metrics AS
SELECT 
  (SELECT COUNT(*) FROM public.reps) as total_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Active') as active_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Independent') as independent_reps,
  (SELECT COUNT(*) FROM public.reps WHERE status = 'Stuck') as stuck_reps_by_status,
  (SELECT public.get_stuck_reps_count()) as stuck_reps_by_activity,
  (SELECT public.get_conversion_rate()) as conversion_rate,
  (SELECT public.get_avg_time_to_independent()) as avg_time_to_independent;

-- 2. Fix Function Search Paths - Update all functions to have secure search path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result text;
BEGIN
    -- Get the user role from profiles table
    SELECT role::text INTO result 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    RETURN COALESCE(result, 'REP');
END;
$$;

-- Update other critical functions with secure search path
CREATE OR REPLACE FUNCTION public.promote_user_role(target_user_id uuid, new_role user_role, promoted_by_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role user_role;
  target_user_current_role user_role;
  rep_progress integer;
BEGIN
  -- Only ADMINs can promote users
  SELECT role INTO current_user_role FROM public.profiles WHERE id = promoted_by_user_id;
  IF current_user_role != 'ADMIN' THEN
    RAISE EXCEPTION 'Only administrators can promote users';
  END IF;
  
  -- Get current role of target user
  SELECT role INTO target_user_current_role FROM public.profiles WHERE id = target_user_id;
  IF target_user_current_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Business rule validation for TRAINER promotion
  IF new_role = 'TRAINER' AND target_user_current_role != 'TRAINER' THEN
    -- Check if user was ever a rep and completed the journey
    SELECT r.overall_progress INTO rep_progress 
    FROM public.reps r 
    WHERE r.user_id = target_user_id 
    AND r.status = 'Independent'
    LIMIT 1;
    
    IF rep_progress IS NULL OR rep_progress < 100 THEN
      RAISE EXCEPTION 'User must complete the full rep journey (Independent status) before becoming a trainer';
    END IF;
  END IF;
  
  -- Update the role
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  
  -- If promoting to TRAINER, create trainer record
  IF new_role = 'TRAINER' AND target_user_current_role != 'TRAINER' THEN
    INSERT INTO public.trainers (user_id, full_name, email)
    SELECT id, full_name, id::text || '@example.com' -- Placeholder email, should be updated
    FROM public.profiles 
    WHERE id = target_user_id;
  END IF;
  
  -- Log the role change for security audit
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    promoted_by_user_id,
    'role_promotion',
    'profiles',
    target_user_id,
    jsonb_build_object('role', target_user_current_role),
    jsonb_build_object('role', new_role, 'promoted_by', promoted_by_user_id)
  );
  
  RETURN true;
END;
$$;