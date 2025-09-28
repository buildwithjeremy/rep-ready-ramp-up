-- Fix 1: Immediate sync of all rep statuses based on activity
-- Update reps who should be stuck but aren't marked as such
UPDATE reps 
SET status = 'Stuck'
WHERE last_activity < (now() - interval '48 hours')
  AND status NOT IN ('Independent', 'Stuck', 'Inactive');

-- Update reps who are marked stuck but have recent activity  
UPDATE reps 
SET status = 'Active'
WHERE last_activity >= (now() - interval '48 hours')
  AND status = 'Stuck';

-- Fix 2: Ensure consistent logic in admin dashboard metrics
-- Update the admin dashboard function to use status field instead of activity calculation
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics_secure()
RETURNS TABLE(
  total_reps bigint, 
  active_reps bigint, 
  independent_reps bigint, 
  stuck_reps_by_status bigint, 
  stuck_reps_by_activity bigint, 
  conversion_rate numeric, 
  avg_time_to_independent numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only return data if user is an admin, otherwise return zeros
  SELECT 
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status != 'Inactive') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Active') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Independent') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN (SELECT COUNT(*) FROM reps WHERE status = 'Stuck') ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN 
      (SELECT COUNT(*) FROM reps WHERE last_activity < (now() - interval '48 hours') AND status != 'Independent' AND status != 'Inactive') 
    ELSE 0 END::bigint,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN get_conversion_rate() ELSE 0 END::numeric,
    CASE WHEN get_current_user_role() = 'ADMIN' THEN get_avg_time_to_independent() ELSE 0 END::numeric;
$function$;

-- Fix 3: Create a proper status sync function that can be called regularly
CREATE OR REPLACE FUNCTION public.sync_rep_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stuck reps (exclude Independent and Inactive)
  UPDATE reps 
  SET status = 'Stuck'
  WHERE last_activity < (now() - interval '48 hours')
    AND status NOT IN ('Independent', 'Stuck', 'Inactive');
    
  -- Update previously stuck reps that are now active
  UPDATE reps 
  SET status = 'Active'
  WHERE last_activity >= (now() - interval '48 hours')
    AND status = 'Stuck';
    
  -- Log the sync operation
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, new_values
  ) VALUES (
    auth.uid(), 'status_sync', 'reps', 
    jsonb_build_object('sync_timestamp', now())
  );
END;
$function$;

-- Fix 4: Ensure triggers are properly set up
-- Drop existing problematic trigger if it exists
DROP TRIGGER IF EXISTS update_rep_status_on_activity ON reps;

-- Create a proper trigger that actually works
CREATE OR REPLACE FUNCTION public.trigger_rep_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip if this is an inactive rep
  IF NEW.status = 'Inactive' THEN
    RETURN NEW;
  END IF;

  -- Update status based on activity for non-independent reps
  IF NEW.status != 'Independent' THEN
    IF NEW.last_activity < (now() - interval '48 hours') THEN
      NEW.status = 'Stuck';
    ELSIF OLD.status = 'Stuck' AND NEW.last_activity >= (now() - interval '48 hours') THEN
      NEW.status = 'Active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER update_rep_status_on_activity
  BEFORE UPDATE ON reps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rep_status_update();