-- Preserve Inactive status from being overridden by automated status logic

-- 1) update_rep_progress: do not change status if current status is Inactive
CREATE OR REPLACE FUNCTION public.update_rep_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Update rep progress and timestamps, but never override Inactive status
  UPDATE public.reps 
  SET 
    overall_progress = rep_progress,
    last_activity = now(),
    status = CASE 
      WHEN status = 'Inactive' THEN 'Inactive'  -- Preserve archived state
      WHEN rep_progress = 100 THEN 'Independent'
      WHEN rep_progress > 0 AND last_activity >= (now() - interval '48 hours') THEN 'Active'
      WHEN last_activity < (now() - interval '48 hours') AND status != 'Independent' THEN 'Stuck'
      ELSE status
    END,
    promotion_date = CASE
      WHEN rep_progress = 100 AND promotion_date IS NULL THEN now()
      ELSE promotion_date
    END
  WHERE id = rep_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2) update_rep_status_by_activity: exit early for Inactive reps
CREATE OR REPLACE FUNCTION public.update_rep_status_by_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Never change archived reps
  IF NEW.status = 'Inactive' THEN
    RETURN NEW;
  END IF;

  -- If rep hasn't been active for 48+ hours and isn't Independent, mark as Stuck
  IF NEW.last_activity < (now() - interval '48 hours') 
     AND NEW.status != 'Independent' 
     AND NEW.status != 'Stuck' THEN
    NEW.status = 'Stuck';
  -- If rep becomes active again and was stuck, mark as Active
  ELSIF NEW.last_activity >= (now() - interval '48 hours') 
        AND NEW.status = 'Stuck' THEN
    NEW.status = 'Active';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3) update_rep_status_based_on_activity: exit early for Inactive reps
CREATE OR REPLACE FUNCTION public.update_rep_status_based_on_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Do not alter archived reps
  IF NEW.status = 'Inactive' THEN
    RETURN NEW;
  END IF;

  -- Update status based on activity and current status
  IF NEW.status = 'Independent' THEN
    -- Don't change Independent status regardless of activity
    RETURN NEW;
  ELSIF EXTRACT(EPOCH FROM (now() - NEW.last_activity)) / 3600 >= 48 THEN
    -- Mark as stuck if no activity for 48+ hours and not Independent
    NEW.status = 'Stuck';
  ELSIF OLD.status = 'Stuck' AND EXTRACT(EPOCH FROM (now() - NEW.last_activity)) / 3600 < 48 THEN
    -- Mark as active if was stuck but now has recent activity
    NEW.status = 'Active';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4) refresh_all_rep_statuses: exclude Inactive from bulk status recalculation
CREATE OR REPLACE FUNCTION public.refresh_all_rep_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stuck reps (exclude Independent, Stuck, and Inactive)
  UPDATE reps 
  SET status = 'Stuck'
  WHERE last_activity < (now() - interval '48 hours')
    AND status NOT IN ('Independent', 'Stuck', 'Inactive');
    
  -- Update previously stuck reps that are now active
  UPDATE reps 
  SET status = 'Active'
  WHERE last_activity >= (now() - interval '48 hours')
    AND status = 'Stuck';
END;
$function$;