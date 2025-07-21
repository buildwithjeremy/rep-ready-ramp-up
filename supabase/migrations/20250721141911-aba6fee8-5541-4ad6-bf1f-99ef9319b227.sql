-- Fix the stuck reps status inconsistency
-- First, update existing reps who should be marked as 'Stuck' based on activity
UPDATE reps 
SET status = 'Stuck'
WHERE last_activity < (now() - interval '48 hours')
  AND status != 'Independent'
  AND status != 'Stuck';

-- Create a function to automatically update rep status based on activity
CREATE OR REPLACE FUNCTION public.update_rep_status_by_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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
$$;

-- Create trigger to automatically update status when last_activity changes
DROP TRIGGER IF EXISTS update_rep_status_on_activity ON public.reps;
CREATE TRIGGER update_rep_status_on_activity
  BEFORE UPDATE OF last_activity ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rep_status_by_activity();

-- Also create a function to run periodically to check all reps
CREATE OR REPLACE FUNCTION public.refresh_all_rep_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update stuck reps
  UPDATE reps 
  SET status = 'Stuck'
  WHERE last_activity < (now() - interval '48 hours')
    AND status != 'Independent'
    AND status != 'Stuck';
    
  -- Update previously stuck reps that are now active
  UPDATE reps 
  SET status = 'Active'
  WHERE last_activity >= (now() - interval '48 hours')
    AND status = 'Stuck';
END;
$$;