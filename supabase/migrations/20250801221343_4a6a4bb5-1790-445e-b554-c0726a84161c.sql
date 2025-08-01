-- Create a trigger to automatically update rep statuses based on activity
-- This will run whenever a rep's last_activity is updated

CREATE OR REPLACE FUNCTION update_rep_status_based_on_activity()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_update_rep_status_on_activity
  BEFORE UPDATE ON reps
  FOR EACH ROW
  EXECUTE FUNCTION update_rep_status_based_on_activity();

-- Also create a trigger for INSERT to handle new reps
CREATE TRIGGER trigger_set_rep_status_on_insert
  BEFORE INSERT ON reps
  FOR EACH ROW
  EXECUTE FUNCTION update_rep_status_based_on_activity();