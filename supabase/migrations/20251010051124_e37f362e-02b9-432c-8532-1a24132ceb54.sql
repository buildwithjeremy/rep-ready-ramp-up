-- Function to log rep creation
CREATE OR REPLACE FUNCTION log_rep_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    new_values
  ) VALUES (
    NEW.trainer_id,
    'rep_created',
    'reps',
    NEW.id,
    jsonb_build_object(
      'rep_name', NEW.full_name,
      'rep_email', NEW.email,
      'trainer_id', NEW.trainer_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for rep creation
DROP TRIGGER IF EXISTS trigger_log_rep_creation ON public.reps;
CREATE TRIGGER trigger_log_rep_creation
  AFTER INSERT ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION log_rep_creation();

-- Function to log subtask completion
CREATE OR REPLACE FUNCTION log_subtask_completion()
RETURNS TRIGGER AS $$
DECLARE
  rep_info RECORD;
  subtask_info RECORD;
BEGIN
  -- Only log when a subtask is being marked as completed
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Get rep and subtask information
    SELECT r.full_name as rep_name, r.trainer_id
    INTO rep_info
    FROM public.reps r
    JOIN public.milestones m ON m.rep_id = r.id
    WHERE m.id = NEW.milestone_id;
    
    -- Get subtask title
    SELECT cts.title
    INTO subtask_info
    FROM public.checklist_template_subtasks cts
    WHERE cts.id = NEW.template_subtask_id;
    
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      NEW.completed_by,
      'subtask_completed',
      'milestone_subtasks',
      NEW.id,
      jsonb_build_object(
        'subtask_title', subtask_info.title,
        'rep_name', rep_info.rep_name,
        'trainer_id', rep_info.trainer_id,
        'completed_by', NEW.completed_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for subtask completion
DROP TRIGGER IF EXISTS trigger_log_subtask_completion ON public.milestone_subtasks;
CREATE TRIGGER trigger_log_subtask_completion
  AFTER UPDATE ON public.milestone_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION log_subtask_completion();

-- Function to log rep status changes (archiving)
CREATE OR REPLACE FUNCTION log_rep_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when rep is archived (status changed to Inactive)
  IF NEW.status = 'Inactive' AND OLD.status != 'Inactive' THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'rep_archived',
      'reps',
      NEW.id,
      jsonb_build_object('status', OLD.status, 'rep_name', OLD.full_name),
      jsonb_build_object('status', NEW.status, 'rep_name', NEW.full_name)
    );
  -- Log when rep is reactivated
  ELSIF OLD.status = 'Inactive' AND NEW.status != 'Inactive' THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'rep_reactivated',
      'reps',
      NEW.id,
      jsonb_build_object('status', OLD.status, 'rep_name', OLD.full_name),
      jsonb_build_object('status', NEW.status, 'rep_name', NEW.full_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for rep status changes
DROP TRIGGER IF EXISTS trigger_log_rep_status_change ON public.reps;
CREATE TRIGGER trigger_log_rep_status_change
  AFTER UPDATE ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION log_rep_status_change();