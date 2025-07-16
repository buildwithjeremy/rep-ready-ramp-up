-- Fix the email for the existing rep record
UPDATE public.reps 
SET email = (SELECT email FROM auth.users WHERE id = reps.user_id)
WHERE user_id = 'b9dfaf48-64ab-4bf7-b24c-98dd05852032';

-- Re-enable RLS on reps table now that we're done with setup
ALTER TABLE public.reps ENABLE ROW LEVEL SECURITY;