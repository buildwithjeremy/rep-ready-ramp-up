-- Add indexes to security_audit_log for better query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at 
  ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_action 
  ON public.security_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id 
  ON public.security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_table_name 
  ON public.security_audit_log(table_name);