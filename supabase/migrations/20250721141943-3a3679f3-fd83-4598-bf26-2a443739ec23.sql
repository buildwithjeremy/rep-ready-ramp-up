-- Update the existing update_rep_progress function to also handle stuck status
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
$$;