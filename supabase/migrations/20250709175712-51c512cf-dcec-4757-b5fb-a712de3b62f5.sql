-- Phase 1: Database Schema Updates

-- First, let's update the reps table to match the frontend interface
-- Add missing fields and change stage to milestone
ALTER TABLE public.reps 
  ADD COLUMN status TEXT NOT NULL DEFAULT 'Active',
  ADD COLUMN overall_progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ADD COLUMN milestone INTEGER NOT NULL DEFAULT 1;

-- Add check constraints for valid values
ALTER TABLE public.reps 
  ADD CONSTRAINT reps_status_check CHECK (status IN ('Active', 'Independent', 'Stuck', 'Inactive')),
  ADD CONSTRAINT reps_overall_progress_check CHECK (overall_progress >= 0 AND overall_progress <= 100),
  ADD CONSTRAINT reps_milestone_check CHECK (milestone >= 1 AND milestone <= 10);

-- Create trainers table for trainer information and performance metrics
CREATE TABLE public.trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  assigned_reps INTEGER NOT NULL DEFAULT 0,
  active_reps INTEGER NOT NULL DEFAULT 0,
  independent_reps INTEGER NOT NULL DEFAULT 0,
  stuck_reps INTEGER NOT NULL DEFAULT 0,
  average_time_to_independent DECIMAL NOT NULL DEFAULT 0,
  success_rate DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trainers table
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Create policies for trainers table
CREATE POLICY "Trainers can view their own profile"
  ON public.trainers
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Trainers can update their own profile"
  ON public.trainers
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all trainers"
  ON public.trainers
  FOR ALL
  USING (get_user_role(auth.uid()) = 'ADMIN'::user_role);

-- Create checklist templates table for the 10-milestone template
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT checklist_templates_milestone_check CHECK (milestone >= 1 AND milestone <= 10)
);

-- Create checklist template subtasks table
CREATE TABLE public.checklist_template_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestone subtasks table for tracking individual subtask completion
CREATE TABLE public.milestone_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  template_subtask_id UUID NOT NULL REFERENCES public.checklist_template_subtasks(id),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_subtasks ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist templates (public read access)
CREATE POLICY "Anyone can view checklist templates"
  ON public.checklist_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view template subtasks"
  ON public.checklist_template_subtasks
  FOR SELECT
  USING (true);

-- Create policies for milestone subtasks (same as milestones)
CREATE POLICY "Users can view milestone subtasks for accessible reps"
  ON public.milestone_subtasks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.reps r ON r.id = m.rep_id
    WHERE m.id = milestone_subtasks.milestone_id
    AND (r.trainer_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN'::user_role)
  ));

CREATE POLICY "Users can update milestone subtasks for accessible reps"
  ON public.milestone_subtasks
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.reps r ON r.id = m.rep_id
    WHERE m.id = milestone_subtasks.milestone_id
    AND (r.trainer_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN'::user_role)
  ));

CREATE POLICY "Users can insert milestone subtasks for accessible reps"
  ON public.milestone_subtasks
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.milestones m
    JOIN public.reps r ON r.id = m.rep_id
    WHERE m.id = milestone_subtasks.milestone_id
    AND (r.trainer_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN'::user_role)
  ));

-- Update milestones table to be cleaner (remove redundant fields)
ALTER TABLE public.milestones 
  DROP COLUMN IF EXISTS step_title,
  DROP COLUMN IF EXISTS sub_task;

-- Add template reference to milestones
ALTER TABLE public.milestones 
  ADD COLUMN template_id UUID REFERENCES public.checklist_templates(id);

-- Create function to update trainer stats automatically
CREATE OR REPLACE FUNCTION public.update_trainer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trainer statistics when rep data changes
  UPDATE public.trainers 
  SET 
    assigned_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id
    ),
    active_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Active'
    ),
    independent_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Independent'
    ),
    stuck_reps = (
      SELECT COUNT(*) FROM public.reps 
      WHERE trainer_id = trainers.user_id AND status = 'Stuck'
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.trainer_id, OLD.trainer_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update trainer stats
CREATE TRIGGER update_trainer_stats_on_rep_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trainer_stats();

-- Create function to calculate overall progress for reps
CREATE OR REPLACE FUNCTION public.calculate_rep_progress(rep_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
BEGIN
  -- Count total subtasks for this rep's milestones
  SELECT COUNT(*) INTO total_subtasks
  FROM public.milestone_subtasks ms
  JOIN public.milestones m ON m.id = ms.milestone_id
  WHERE m.rep_id = calculate_rep_progress.rep_id;
  
  -- Count completed subtasks
  SELECT COUNT(*) INTO completed_subtasks
  FROM public.milestone_subtasks ms
  JOIN public.milestones m ON m.id = ms.milestone_id
  WHERE m.rep_id = calculate_rep_progress.rep_id AND ms.completed = true;
  
  -- Return percentage (0-100)
  IF total_subtasks = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((completed_subtasks::DECIMAL / total_subtasks::DECIMAL) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update rep progress and status
CREATE OR REPLACE FUNCTION public.update_rep_progress()
RETURNS TRIGGER AS $$
DECLARE
  rep_progress INTEGER;
  rep_record RECORD;
BEGIN
  -- Get the rep record
  SELECT r.* INTO rep_record
  FROM public.reps r
  JOIN public.milestones m ON m.rep_id = r.id
  WHERE m.id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  -- Calculate new progress
  rep_progress := public.calculate_rep_progress(rep_record.id);
  
  -- Update rep progress and status
  UPDATE public.reps 
  SET 
    overall_progress = rep_progress,
    last_activity = now(),
    status = CASE 
      WHEN rep_progress = 100 THEN 'Independent'
      WHEN rep_progress > 0 THEN 'Active'
      ELSE status
    END,
    promotion_date = CASE
      WHEN rep_progress = 100 AND promotion_date IS NULL THEN now()
      ELSE promotion_date
    END
  WHERE id = rep_record.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update rep progress when subtasks change
CREATE TRIGGER update_rep_progress_on_subtask_change
  AFTER INSERT OR UPDATE OR DELETE ON public.milestone_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rep_progress();

-- Create indexes for better performance
CREATE INDEX idx_reps_trainer_id ON public.reps(trainer_id);
CREATE INDEX idx_reps_status ON public.reps(status);
CREATE INDEX idx_reps_milestone ON public.reps(milestone);
CREATE INDEX idx_milestones_rep_id ON public.milestones(rep_id);
CREATE INDEX idx_milestone_subtasks_milestone_id ON public.milestone_subtasks(milestone_id);
CREATE INDEX idx_trainers_user_id ON public.trainers(user_id);