-- Update get_available_trainers function to use trainers table
CREATE OR REPLACE FUNCTION public.get_available_trainers()
 RETURNS TABLE(id uuid, full_name text, assigned_reps bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    t.user_id as id,
    t.full_name,
    t.assigned_reps::bigint
  FROM trainers t
  ORDER BY t.assigned_reps ASC, t.full_name ASC;
$function$