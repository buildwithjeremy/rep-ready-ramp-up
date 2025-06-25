
-- First, let's work with the existing enum values
-- The existing enum seems to have 'REP' as the default, so let's work with that

-- Create rep_stage enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE rep_stage AS ENUM ('board_a', 'board_b', 'board_c', 'independent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add trainer_id column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN trainer_id uuid REFERENCES public.profiles(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create reps table for tracking representatives
CREATE TABLE IF NOT EXISTS public.reps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  trainer_id uuid REFERENCES public.profiles(id) NOT NULL,
  stage rep_stage NOT NULL DEFAULT 'board_a',
  join_date timestamp with time zone NOT NULL DEFAULT now(),
  promotion_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create milestones table for tracking progress
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rep_id uuid REFERENCES public.reps(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL CHECK (step_number >= 1 AND step_number <= 13),
  step_title text NOT NULL,
  sub_task text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all reps" ON public.reps;
DROP POLICY IF EXISTS "Trainers can view their reps" ON public.reps;
DROP POLICY IF EXISTS "Trainers can insert reps" ON public.reps;
DROP POLICY IF EXISTS "Trainers can update their reps" ON public.reps;

-- Create a security definer function to avoid RLS recursion issues
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for reps (using the security definer function)
CREATE POLICY "Admins can view all reps" ON public.reps FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'ADMIN'
);
CREATE POLICY "Trainers can view their reps" ON public.reps FOR SELECT USING (
  trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
);
CREATE POLICY "Trainers can insert reps" ON public.reps FOR INSERT WITH CHECK (
  trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
);
CREATE POLICY "Trainers can update their reps" ON public.reps FOR UPDATE USING (
  trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
);

-- RLS Policies for milestones
CREATE POLICY "Users can view milestones for accessible reps" ON public.milestones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reps r 
    WHERE r.id = rep_id AND (
      r.trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
    )
  )
);
CREATE POLICY "Users can insert milestones for accessible reps" ON public.milestones FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reps r 
    WHERE r.id = rep_id AND (
      r.trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
    )
  )
);
CREATE POLICY "Users can update milestones for accessible reps" ON public.milestones FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.reps r 
    WHERE r.id = rep_id AND (
      r.trainer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'ADMIN'
    )
  )
);

-- Update the handle_new_user function to work with our app structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'REP'
  );
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
