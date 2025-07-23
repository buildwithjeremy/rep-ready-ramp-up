-- Remove the conflicting policy first
DROP POLICY IF EXISTS "Users can update their own avatar_url" ON public.profiles;

-- The existing "Users can update own basic profile info" policy already allows avatar_url updates
-- No additional policy needed for avatar_url updates