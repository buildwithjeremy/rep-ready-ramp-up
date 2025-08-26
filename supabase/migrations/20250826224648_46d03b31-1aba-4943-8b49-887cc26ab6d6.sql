CREATE OR REPLACE FUNCTION public.handle_new_rep_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_phone text;
  user_birthday date;
  user_email text;
  trainer_id_value uuid;
  rep_record_id uuid;
BEGIN
  IF (NEW.role = 'REP' AND (OLD IS NULL OR OLD.role != 'REP')) THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    trainer_id_value := NEW.trainer_id;
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

    IF user_phone IS NOT NULL THEN
      user_phone := regexp_replace(user_phone, '[^0-9]', '', 'g');
      IF length(user_phone) = 10 THEN
        user_phone := '(' || substring(user_phone, 1, 3) || ') ' || 
                     substring(user_phone, 4, 3) || '-' || 
                     substring(user_phone, 7, 4);
      END IF;
    END IF;

    IF trainer_id_value IS NULL THEN
      RAISE EXCEPTION 'trainer_id is required for REP users';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.trainers WHERE user_id = trainer_id_value) THEN
      RAISE EXCEPTION 'Invalid trainer_id provided';
    END IF;

    INSERT INTO public.reps (
      user_id, full_name, email, phone, birthday, trainer_id,
      milestone, status, overall_progress, join_date, last_activity
    ) VALUES (
      NEW.id, NEW.full_name, user_email, user_phone, user_birthday, trainer_id_value,
      1, 'Active', 0, now(), now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, reps.phone),
      birthday = COALESCE(EXCLUDED.birthday, reps.birthday),
      trainer_id = EXCLUDED.trainer_id,
      updated_at = now()
    RETURNING id INTO rep_record_id;

    INSERT INTO public.milestones (rep_id, step_number, template_id)
    SELECT rep_record_id, ct.milestone, ct.id
    FROM public.checklist_templates ct
    ON CONFLICT DO NOTHING;

    INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id)
    SELECT m.id, cts.id
    FROM public.milestones m
    JOIN public.checklist_templates ct ON ct.id = m.template_id
    JOIN public.checklist_template_subtasks cts ON cts.template_id = ct.id
    WHERE m.rep_id = rep_record_id
    ON CONFLICT DO NOTHING;

    -- Best-effort call to EZ Text integration; function is public (verify_jwt=false)
    BEGIN
      PERFORM net.http_post(
        url := 'https://wpinbiwlbsyqtayqixea.supabase.co/functions/v1/eztext-integration',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'name', NEW.full_name,
          'phone', user_phone,
          'email', user_email,
          'birthday', user_birthday,
          'requestId', 'self-signup-trigger-' || NEW.id::text || '-' || extract(epoch from now())::text,
          'source', 'self-signup-trigger'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error calling EZ Text integration in trigger: % %', SQLERRM, SQLSTATE;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_rep_user: % %', SQLERRM, SQLSTATE;
  RAISE;
END;
$function$;