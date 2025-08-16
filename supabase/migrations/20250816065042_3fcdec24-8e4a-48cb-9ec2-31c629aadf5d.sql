-- CRITICAL SECURITY FIXES

-- 1. Fix privilege escalation in promote_user_role function
-- Replace the insecure version that uses promoted_by_user_id parameter
CREATE OR REPLACE FUNCTION public.promote_user_role(target_user_id uuid, new_role user_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role user_role;
  target_user_current_role user_role;
  rep_progress integer;
BEGIN
  -- Only ADMINs can promote users - use auth.uid() for security
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
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
  
  -- Log the role change for security audit (using auth.uid() for promoted_by)
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    'role_promotion',
    'profiles',
    target_user_id,
    jsonb_build_object('role', target_user_current_role),
    jsonb_build_object('role', new_role, 'promoted_by', auth.uid())
  );
  
  RETURN true;
END;
$function$;

-- 2. Remove the dangerous "Users can view all profiles" policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Replace with secure, role-based policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT 
USING (get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Trainers can view assigned reps profiles" ON public.profiles
FOR SELECT
USING (
  get_user_role(auth.uid()) = 'TRAINER' AND 
  (auth.uid() = id OR trainer_id = auth.uid())
);

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 3. Fix RLS on reps table - tighten insert policy
DROP POLICY IF EXISTS "Trainers can insert reps" ON public.reps;

CREATE POLICY "Only trainers and admins can insert reps" ON public.reps
FOR INSERT
WITH CHECK (
  (get_user_role(auth.uid()) = 'TRAINER' AND trainer_id = auth.uid()) OR
  get_user_role(auth.uid()) = 'ADMIN'
);

-- 4. Add missing RLS policies for better security
CREATE POLICY "Only admins can delete reps" ON public.reps
FOR DELETE
USING (get_user_role(auth.uid()) = 'ADMIN');

-- 5. Secure milestone_subtasks deletion
CREATE POLICY "Only trainers and admins can delete milestone subtasks" ON public.milestone_subtasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM milestones m
    JOIN reps r ON r.id = m.rep_id
    WHERE m.id = milestone_subtasks.milestone_id 
    AND (r.trainer_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN')
  )
);

-- 6. Secure milestones deletion
CREATE POLICY "Only trainers and admins can delete milestones" ON public.milestones
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM reps r
    WHERE r.id = milestones.rep_id 
    AND (r.trainer_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN')
  )
);

-- 7. Add security audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log all role changes, deletions, and promotions
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.security_audit_log (
      user_id, action, table_name, record_id, old_values
    ) VALUES (
      auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'profiles' AND OLD.role != NEW.role THEN
    INSERT INTO public.security_audit_log (
      user_id, action, table_name, record_id, old_values, new_values
    ) VALUES (
      auth.uid(), 'role_change', TG_TABLE_NAME, NEW.id, 
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the logging trigger to profiles for role changes
DROP TRIGGER IF EXISTS log_role_changes ON public.profiles;
CREATE TRIGGER log_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_operations();