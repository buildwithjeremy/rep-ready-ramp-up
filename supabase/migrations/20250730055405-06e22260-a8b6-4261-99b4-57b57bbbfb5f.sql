-- Phase 1: Fix Birthday Column Data (move from address to birthday)
-- Move date patterns from address column to birthday column
UPDATE reps 
SET 
  birthday = CASE 
    WHEN address ~ '^\d{4}-\d{2}-\d{2}$' THEN address::date
    WHEN address ~ '^\d{2}/\d{2}/\d{4}$' THEN 
      TO_DATE(address, 'MM/DD/YYYY')
    WHEN address ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN 
      TO_DATE(address, 'M/D/YYYY')
    ELSE NULL
  END,
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

-- Phase 3: Backfill Missing Data for reps from 7/26 onwards
-- First, let's update phone numbers from auth metadata
UPDATE public.reps 
SET 
  phone = CASE 
    WHEN au.raw_user_meta_data->>'phone' IS NOT NULL THEN
      CASE 
        WHEN length(regexp_replace(au.raw_user_meta_data->>'phone', '[^0-9]', '', 'g')) = 10 THEN
          '(' || substring(regexp_replace(au.raw_user_meta_data->>'phone', '[^0-9]', '', 'g'), 1, 3) || ') ' || 
          substring(regexp_replace(au.raw_user_meta_data->>'phone', '[^0-9]', '', 'g'), 4, 3) || '-' || 
          substring(regexp_replace(au.raw_user_meta_data->>'phone', '[^0-9]', '', 'g'), 7, 4)
        ELSE au.raw_user_meta_data->>'phone'
      END
    ELSE phone
  END,
  birthday = CASE 
    WHEN au.raw_user_meta_data->>'birthday' IS NOT NULL THEN
      (au.raw_user_meta_data->>'birthday')::date
    ELSE birthday
  END,
  updated_at = now()
FROM auth.users au
WHERE reps.user_id = au.id
  AND reps.join_date >= '2024-07-26'
  AND (reps.phone IS NULL OR reps.birthday IS NULL)
  AND (au.raw_user_meta_data->>'phone' IS NOT NULL OR au.raw_user_meta_data->>'birthday' IS NOT NULL);

-- Phase 4: Data Validation Function
CREATE OR REPLACE FUNCTION public.validate_rep_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log any issues with missing phone/birthday for new reps
  IF NEW.phone IS NULL OR NEW.birthday IS NULL THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      NEW.user_id,
      'incomplete_rep_data',
      'reps',
      NEW.id,
      jsonb_build_object(
        'phone_missing', NEW.phone IS NULL,
        'birthday_missing', NEW.birthday IS NULL,
        'join_date', NEW.join_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS validate_rep_data_trigger ON public.reps;
CREATE TRIGGER validate_rep_data_trigger
  AFTER INSERT OR UPDATE ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rep_data();