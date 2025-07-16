-- Add RLS policy for REPs to view their own records
CREATE POLICY "Reps can view their own records" 
ON public.reps 
FOR SELECT 
USING (user_id = auth.uid());