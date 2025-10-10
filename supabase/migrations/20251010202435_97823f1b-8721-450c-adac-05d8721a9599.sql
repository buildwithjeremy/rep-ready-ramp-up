-- Part 1: Remove the validate_rep_data trigger and function
DROP TRIGGER IF EXISTS validate_rep_data_trigger ON public.reps;
DROP FUNCTION IF EXISTS public.validate_rep_data();

-- Clean up existing incomplete_rep_data logs
DELETE FROM public.security_audit_log 
WHERE action = 'incomplete_rep_data';