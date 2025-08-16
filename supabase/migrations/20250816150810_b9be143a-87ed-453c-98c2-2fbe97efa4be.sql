-- Create a public function for signup that allows unauthenticated users to see basic trainer info
-- This is needed because users must select a trainer during signup before they're authenticated

CREATE OR REPLACE FUNCTION public.get_trainers_for_signup()
RETURNS TABLE(id uuid, full_name text, assigned_reps bigint)
LANGUAGE sql
STABLE
-- No SECURITY DEFINER needed, this will be publicly accessible
SET search_path = 'public'
AS $$
  -- Return basic trainer info for signup - this is public information
  SELECT 
    t.user_id as id,
    t.full_name,
    t.assigned_reps::bigint
  FROM trainers t
  ORDER BY t.assigned_reps ASC, t.full_name ASC;
$$;