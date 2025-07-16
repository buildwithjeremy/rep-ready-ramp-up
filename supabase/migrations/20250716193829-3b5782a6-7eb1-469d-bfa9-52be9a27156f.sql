-- Add unique constraint on user_id in reps table to support ON CONFLICT
ALTER TABLE public.reps ADD CONSTRAINT reps_user_id_unique UNIQUE (user_id);