-- Phase 3: Backfill Missing Data for reps from 7/26 onwards
-- Create a safe function to extract and format phone numbers
CREATE OR REPLACE FUNCTION safe_format_phone(phone_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  clean_phone text;
BEGIN
  IF phone_raw IS NULL OR phone_raw = '' THEN
    RETURN NULL;
  END IF;
  
  -- Remove all non-numeric characters
  clean_phone := regexp_replace(phone_raw, '[^0-9]', '', 'g');
  
  -- Format as (XXX) XXX-XXXX if 10 digits, otherwise return original
  IF length(clean_phone) = 10 THEN
    RETURN '(' || substring(clean_phone, 1, 3) || ') ' || 
           substring(clean_phone, 4, 3) || '-' || 
           substring(clean_phone, 7, 4);
  ELSE
    RETURN phone_raw; -- Return original if not 10 digits
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN phone_raw; -- Return original on any error
END;
$$;

-- Create a safe function to extract birthday
CREATE OR REPLACE FUNCTION safe_extract_birthday(birthday_raw text)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  parsed_date date;
BEGIN
  IF birthday_raw IS NULL OR birthday_raw = '' THEN
    RETURN NULL;
  END IF;
  
  -- Try to parse as date
  parsed_date := birthday_raw::date;
  
  -- Validate the parsed date is reasonable
  IF parsed_date >= '1900-01-01'::date AND parsed_date <= CURRENT_DATE THEN
    RETURN parsed_date;
  ELSE
    RETURN NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Update phone numbers and birthdays from auth metadata for reps from 7/26 onwards
UPDATE public.reps 
SET 
  phone = CASE 
    WHEN reps.phone IS NULL AND au.raw_user_meta_data->>'phone' IS NOT NULL THEN
      safe_format_phone(au.raw_user_meta_data->>'phone')
    ELSE reps.phone
  END,
  birthday = CASE 
    WHEN reps.birthday IS NULL AND au.raw_user_meta_data->>'birthday' IS NOT NULL THEN
      safe_extract_birthday(au.raw_user_meta_data->>'birthday')
    ELSE reps.birthday
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
SET search_path = public
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

-- Clean up temporary functions
DROP FUNCTION safe_format_phone(text);
DROP FUNCTION safe_extract_birthday(text);