-- Fix handle_new_user function to properly extract trainer_id from signup metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_trainer_id uuid;
  user_role user_role;
BEGIN
  -- Extract trainer_id and role from raw_user_meta_data
  SELECT 
    CASE 
      WHEN raw_user_meta_data->>'trainer_id' IS NOT NULL 
      THEN (raw_user_meta_data->>'trainer_id')::uuid
      ELSE NULL
    END,
    CASE 
      WHEN raw_user_meta_data->>'role' IS NOT NULL 
      THEN (raw_user_meta_data->>'role')::user_role
      ELSE 'REP'::user_role
    END
  INTO user_trainer_id, user_role
  FROM auth.users 
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, full_name, role, trainer_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    user_trainer_id
  );
  
  RETURN NEW;
END;
$function$;