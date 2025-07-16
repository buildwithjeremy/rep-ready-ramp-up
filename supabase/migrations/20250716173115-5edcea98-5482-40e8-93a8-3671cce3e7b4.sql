-- Create milestones for all existing reps
INSERT INTO public.milestones (rep_id, step_number, template_id, completed)
SELECT 
  r.id as rep_id,
  ct.milestone as step_number,
  ct.id as template_id,
  CASE 
    WHEN ct.milestone < r.milestone THEN true
    WHEN ct.milestone = r.milestone THEN false  -- Current milestone should not be auto-completed
    ELSE false
  END as completed
FROM public.reps r
CROSS JOIN public.checklist_templates ct
WHERE NOT EXISTS (
  SELECT 1 FROM public.milestones m 
  WHERE m.rep_id = r.id AND m.step_number = ct.milestone
);

-- Create milestone subtasks for all existing reps
INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id, completed)
SELECT 
  m.id as milestone_id,
  cts.id as template_subtask_id,
  m.completed as completed  -- Follow the milestone completion status
FROM public.milestones m
JOIN public.checklist_templates ct ON ct.id = m.template_id
JOIN public.checklist_template_subtasks cts ON cts.template_id = ct.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.milestone_subtasks ms 
  WHERE ms.milestone_id = m.id AND ms.template_subtask_id = cts.id
);