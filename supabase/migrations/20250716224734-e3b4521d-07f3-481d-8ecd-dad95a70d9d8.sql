-- Drop and recreate the problematic get_user_role function to fix return type issue
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create the single function that handles both cases
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT NULL::uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = COALESCE(user_id, auth.uid());
$function$;