-- SECURITY FIX: Address critical role escalation vulnerability and function security issues

-- Phase 1: Fix Critical Role Escalation Vulnerability
-- Drop the dangerous "Users can update own profile" policy that allows role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create secure, field-specific update policies
CREATE POLICY "Users can update own basic profile info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes - role field cannot be modified by users
  (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
);

-- Only ADMINs can update user roles
CREATE POLICY "Admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'ADMIN') 
WITH CHECK (get_user_role(auth.uid()) = 'ADMIN');

-- Phase 2: Secure Database Functions - Fix mutable search paths
-- Update handle_new_user function to have secure search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'REP'
  );
  RETURN NEW;
END;
$$;

-- Update get_user_role function to have secure search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Update update_trainer_stats function to have secure search path
CREATE OR REPLACE FUNCTION public.update_trainer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update trainer statistics when rep data changes
  UPDATE public.trainers 
  SET 
    assigned_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id
    ),
    active_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Active'
    ),
    independent_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Independent'
    ),
    stuck_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Stuck'
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.trainer_id, OLD.trainer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update calculate_rep_progress function to have secure search path
CREATE OR REPLACE FUNCTION public.calculate_rep_progress(rep_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
BEGIN
  -- Count total subtasks for this rep's milestones
  SELECT COUNT(*) INTO total_subtasks
  FROM public.milestone_subtasks ms
  JOIN public.milestones m ON m.id = ms.milestone_id
  WHERE m.rep_id = calculate_rep_progress.rep_id;
  
  -- Count completed subtasks
  SELECT COUNT(*) INTO completed_subtasks
  FROM public.milestone_subtasks ms
  JOIN public.milestones m ON m.id = ms.milestone_id
  WHERE m.rep_id = calculate_rep_progress.rep_id AND ms.completed = true;
  
  -- Return percentage (0-100)
  IF total_subtasks = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_subtasks::DECIMAL / total_subtasks::DECIMAL) * 100);
END;
$$;

-- Update update_rep_progress function to have secure search path
CREATE OR REPLACE FUNCTION public.update_rep_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  rep_progress INTEGER;
  rep_record RECORD;
BEGIN
  -- Get the rep record
  SELECT r.* INTO rep_record
  FROM public.reps r
  JOIN public.milestones m ON m.rep_id = r.id
  WHERE m.id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  -- Calculate new progress
  rep_progress := public.calculate_rep_progress(rep_record.id);
  
  -- Update rep progress and status
  UPDATE public.reps 
  SET 
    overall_progress = rep_progress,
    last_activity = now(),
    status = CASE 
      WHEN rep_progress = 100 THEN 'Independent'
      WHEN rep_progress > 0 THEN 'Active'
      ELSE status
    END,
    promotion_date = CASE
      WHEN rep_progress = 100 AND promotion_date IS NULL THEN now()
      ELSE promotion_date
    END
  WHERE id = rep_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only ADMINs can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'ADMIN');

-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log role changes for security monitoring
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role change logging
CREATE TRIGGER log_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();