-- Update the handle_new_rep_user function to call EZ Text integration
CREATE OR REPLACE FUNCTION public.handle_new_rep_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_phone text;
  user_birthday date;
  user_email text;
  trainer_id_value uuid;
  rep_record_id uuid;
BEGIN
  -- If a user is created with REP role, or role is updated to REP, create a rep record
  IF (NEW.role = 'REP' AND (OLD IS NULL OR OLD.role != 'REP')) THEN
    -- Get email from auth.users using a security definer context
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    
    -- Get trainer_id and user data from the profile
    trainer_id_value := NEW.trainer_id;
    
    -- Extract phone and birthday from auth.users raw_user_meta_data
    -- This needs to be done in a security definer context
    SELECT 
      raw_user_meta_data->>'phone',
      CASE 
        WHEN raw_user_meta_data->>'birthday' IS NOT NULL AND raw_user_meta_data->>'birthday' != ''
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
    
    -- Validate trainer_id is provided and exists
    IF trainer_id_value IS NULL THEN
      RAISE EXCEPTION 'trainer_id is required for REP users';
    END IF;
    
    -- Verify trainer exists
    IF NOT EXISTS (SELECT 1 FROM public.trainers WHERE user_id = trainer_id_value) THEN
      RAISE EXCEPTION 'Invalid trainer_id provided';
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
      trainer_id_value,
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
      updated_at = now()
    RETURNING id INTO rep_record_id;
    
    -- Create initial milestones for the rep
    INSERT INTO public.milestones (rep_id, step_number, template_id)
    SELECT 
      rep_record_id,
      ct.milestone,
      ct.id
    FROM public.checklist_templates ct
    ON CONFLICT DO NOTHING;
    
    -- Create initial milestone subtasks
    INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id)
    SELECT 
      m.id,
      cts.id
    FROM public.milestones m
    JOIN public.checklist_templates ct ON ct.id = m.template_id
    JOIN public.checklist_template_subtasks cts ON cts.template_id = ct.id
    WHERE m.rep_id = rep_record_id
    ON CONFLICT DO NOTHING;
    
    -- Call EZ Text integration for self-signup
    BEGIN
      PERFORM net.http_post(
        url := 'https://wpinbiwlbsyqtayqixea.supabase.co/functions/v1/eztext-integration',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'name', NEW.full_name,
          'phone', user_phone,
          'email', user_email,
          'birthday', user_birthday,
          'requestId', 'self-signup-' || NEW.id::text || '-' || extract(epoch from now())::text,
          'source', 'self-signup-trigger'
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the signup process
        RAISE LOG 'Error calling EZ Text integration in trigger: % %', SQLERRM, SQLSTATE;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_rep_user: % %', SQLERRM, SQLSTATE;
    -- Re-raise the error
    RAISE;
END;
$function$;