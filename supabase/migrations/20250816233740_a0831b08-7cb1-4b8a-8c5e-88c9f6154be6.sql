-- Recreate signup trainers function as SECURITY DEFINER to bypass RLS safely while returning only minimal fields
DROP FUNCTION IF EXISTS public.get_trainers_for_signup();

CREATE OR REPLACE FUNCTION public.get_trainers_for_signup()
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.user_id AS id, t.full_name
  FROM public.trainers t
  ORDER BY t.full_name ASC;
$$;

-- Ensure execution is allowed to anon and authenticated (PUBLIC)
GRANT EXECUTE ON FUNCTION public.get_trainers_for_signup() TO anon, authenticated;