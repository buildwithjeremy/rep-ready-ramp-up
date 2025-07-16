-- Create trigger to automatically mark milestones as completed when all subtasks are done
CREATE OR REPLACE FUNCTION public.update_milestone_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
  milestone_record RECORD;
BEGIN
  -- Get the milestone record
  SELECT * INTO milestone_record 
  FROM milestones 
  WHERE id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  -- Count total and completed subtasks for this milestone
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
  INTO total_subtasks, completed_subtasks
  FROM milestone_subtasks 
  WHERE milestone_id = milestone_record.id;
  
  -- Update milestone completion status
  IF total_subtasks > 0 AND completed_subtasks = total_subtasks THEN
    -- All subtasks completed - mark milestone as completed
    UPDATE milestones 
    SET 
      completed = true,
      completed_at = COALESCE(milestone_record.completed_at, now()),
      completed_by = COALESCE(milestone_record.completed_by, auth.uid())
    WHERE id = milestone_record.id AND completed = false;
  ELSE
    -- Not all subtasks completed - mark milestone as incomplete
    UPDATE milestones 
    SET 
      completed = false,
      completed_at = null,
      completed_by = null
    WHERE id = milestone_record.id AND completed = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger on milestone_subtasks table
DROP TRIGGER IF EXISTS update_milestone_completion_trigger ON milestone_subtasks;
CREATE TRIGGER update_milestone_completion_trigger
  AFTER INSERT OR UPDATE OR DELETE ON milestone_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_completion();

-- Fix Alice Brown's milestones by running the completion logic manually
DO $$
DECLARE
  milestone_rec RECORD;
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
BEGIN
  -- Loop through all milestones and update their completion status
  FOR milestone_rec IN 
    SELECT DISTINCT m.id, m.completed 
    FROM milestones m 
    JOIN reps r ON r.id = m.rep_id 
    WHERE r.full_name = 'Alice Brown'
  LOOP
    -- Count subtasks for this milestone
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed_count
    INTO total_subtasks, completed_subtasks
    FROM milestone_subtasks 
    WHERE milestone_id = milestone_rec.id;
    
    -- Update milestone completion status
    IF total_subtasks > 0 AND completed_subtasks = total_subtasks THEN
      UPDATE milestones 
      SET 
        completed = true,
        completed_at = COALESCE(completed_at, now())
      WHERE id = milestone_rec.id AND completed = false;
    ELSE
      UPDATE milestones 
      SET 
        completed = false,
        completed_at = null,
        completed_by = null
      WHERE id = milestone_rec.id AND completed = true;
    END IF;
  END LOOP;
END $$;