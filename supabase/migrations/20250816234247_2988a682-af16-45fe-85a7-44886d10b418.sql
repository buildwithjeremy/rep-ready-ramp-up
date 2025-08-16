-- Fix critical security issue: Business Metrics Exposed to All Users
-- Enable RLS on admin_dashboard_metrics table and restrict access to admins only

-- Enable Row-Level Security on the admin_dashboard_metrics table
ALTER TABLE public.admin_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admin users to view business metrics
CREATE POLICY "Only admins can view business metrics" 
ON public.admin_dashboard_metrics
FOR SELECT 
TO authenticated
USING (get_user_role(auth.uid()) = 'ADMIN'::user_role);

-- Create policy to allow only admins to insert business metrics (if needed for system operations)
CREATE POLICY "Only admins can insert business metrics" 
ON public.admin_dashboard_metrics
FOR INSERT 
TO authenticated
WITH CHECK (get_user_role(auth.uid()) = 'ADMIN'::user_role);

-- Create policy to allow only admins to update business metrics (if needed for system operations)
CREATE POLICY "Only admins can update business metrics" 
ON public.admin_dashboard_metrics
FOR UPDATE 
TO authenticated
USING (get_user_role(auth.uid()) = 'ADMIN'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'ADMIN'::user_role);

-- Create policy to allow only admins to delete business metrics (if needed for cleanup)
CREATE POLICY "Only admins can delete business metrics" 
ON public.admin_dashboard_metrics
FOR DELETE 
TO authenticated
USING (get_user_role(auth.uid()) = 'ADMIN'::user_role);