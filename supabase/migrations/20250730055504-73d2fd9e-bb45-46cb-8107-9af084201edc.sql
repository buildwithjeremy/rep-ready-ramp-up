-- Phase 1: Fix Birthday Column Data (move from address to birthday) - Safe version
-- First, let's handle the date conversion more carefully to avoid constraint violations

-- Create a temporary function to safely parse dates
CREATE OR REPLACE FUNCTION safe_parse_birthday(date_string text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parsed_date date;
BEGIN
  -- Try different date formats and validate the result
  IF date_string ~ '^\d{4}-\d{2}-\d{2}$' THEN
    parsed_date := date_string::date;
  ELSIF date_string ~ '^\d{2}/\d{2}/\d{4}$' THEN
    parsed_date := TO_DATE(date_string, 'MM/DD/YYYY');
  ELSIF date_string ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    parsed_date := TO_DATE(date_string, 'M/D/YYYY');
  ELSE
    RETURN NULL;
  END IF;
  
  -- Validate the parsed date is reasonable (between 1900 and current date)
  IF parsed_date >= '1900-01-01'::date AND parsed_date <= CURRENT_DATE THEN
    RETURN parsed_date;
  ELSE
    -- Log invalid dates for investigation
    RAISE NOTICE 'Invalid birthday date rejected: %', date_string;
    RETURN NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to parse birthday: %', date_string;
    RETURN NULL;
END;
$$;

-- Move date patterns from address column to birthday column (safely)
UPDATE reps 
SET 
  birthday = safe_parse_birthday(address),
  address = CASE 
    WHEN address ~ '^\d{4}-\d{2}-\d{2}$' OR 
         address ~ '^\d{2}/\d{2}/\d{4}$' OR 
         address ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN NULL
    ELSE address
  END
WHERE address IS NOT NULL 
  AND (address ~ '^\d{4}-\d{2}-\d{2}$' OR 
       address ~ '^\d{2}/\d{2}/\d{4}$' OR 
       address ~ '^\d{1,2}/\d{1,2}/\d{4}$');

-- Clean up the temporary function
DROP FUNCTION safe_parse_birthday(text);

-- Phase 2: Update Database Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_rep_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_phone text;
  user_birthday date;
  user_email text;
BEGIN
  -- If a user is created with REP role, or role is updated to REP, create a rep record
  IF (NEW.role = 'REP' AND (OLD IS NULL OR OLD.role != 'REP')) THEN
    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    
    -- Extract phone and birthday from raw_user_meta_data if available
    SELECT 
      raw_user_meta_data->>'phone',
      CASE 
        WHEN raw_user_meta_data->>'birthday' IS NOT NULL 
        THEN (raw_user_meta_data->>'birthday')::date
        ELSE NULL
      END
    INTO user_phone, user_birthday
    FROM auth.users 
    WHERE id = NEW.id;
    
    -- Clean phone number (remove formatting)
    IF user_phone IS NOT NULL THEN
      user_phone := regexp_replace(user_phone, '[^0-9]', '', 'g');
      -- Format as (XXX) XXX-XXXX if 10 digits
      IF length(user_phone) = 10 THEN
        user_phone := '(' || substring(user_phone, 1, 3) || ') ' || 
                     substring(user_phone, 4, 3) || '-' || 
                     substring(user_phone, 7, 4);
      END IF;
    END IF;
    
    -- Insert a new rep record for this user
    INSERT INTO public.reps (
      user_id,
      full_name,
      email,
      phone,
      birthday,
      trainer_id,
      milestone,
      status,
      overall_progress,
      join_date,
      last_activity
    ) VALUES (
      NEW.id,
      NEW.full_name,
      user_email,
      user_phone,
      user_birthday,
      NEW.trainer_id, -- Must be explicitly provided, no auto-assignment
      1,
      'Active',
      0,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, reps.phone),
      birthday = COALESCE(EXCLUDED.birthday, reps.birthday),
      trainer_id = EXCLUDED.trainer_id,
      updated_at = now();
    
    -- Create initial milestones for the rep
    INSERT INTO public.milestones (rep_id, step_number, template_id)
    SELECT 
      (SELECT id FROM reps WHERE user_id = NEW.id),
      ct.milestone,
      ct.id
    FROM checklist_templates ct
    ON CONFLICT DO NOTHING;
    
    -- Create initial milestone subtasks
    INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id)
    SELECT 
      m.id,
      cts.id
    FROM milestones m
    JOIN checklist_templates ct ON ct.id = m.template_id
    JOIN checklist_template_subtasks cts ON cts.template_id = ct.id
    WHERE m.rep_id = (SELECT id FROM reps WHERE user_id = NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;