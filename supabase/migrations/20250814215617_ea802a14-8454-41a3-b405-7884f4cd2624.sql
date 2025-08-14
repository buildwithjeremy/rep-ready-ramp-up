-- Add RLS policies to admin_dashboard_metrics view to restrict access to admins only
-- Enable Row Level Security on the view
ALTER VIEW public.admin_dashboard_metrics SET (security_barrier = true);

-- Create RLS policy to only allow admin users to access the admin dashboard metrics
CREATE POLICY "Only admins can view admin dashboard metrics" 
ON public.admin_dashboard_metrics 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'ADMIN');