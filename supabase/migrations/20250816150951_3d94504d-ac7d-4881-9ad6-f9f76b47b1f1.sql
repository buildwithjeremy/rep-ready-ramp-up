-- Add RLS policy to allow unauthenticated users to view basic trainer info for signup
-- This is needed so the signup form can show available trainers

CREATE POLICY "Public can view trainers for signup" 
ON public.trainers
FOR SELECT 
TO anon, authenticated
USING (true);