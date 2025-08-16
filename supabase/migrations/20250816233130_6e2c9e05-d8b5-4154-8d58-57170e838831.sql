-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Public can view trainers for signup" ON public.trainers;

-- Update the get_trainers_for_signup function to only return id and name (no rep count)
CREATE OR REPLACE FUNCTION public.get_trainers_for_signup()
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  -- Return only basic trainer info for signup - just id and name
  SELECT 
    t.user_id as id,
    t.full_name
  FROM trainers t
  ORDER BY t.full_name ASC;
$function$