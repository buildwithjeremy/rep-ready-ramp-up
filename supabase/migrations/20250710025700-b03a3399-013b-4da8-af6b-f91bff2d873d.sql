-- Create milestones and subtasks for the test reps

-- Create milestones for each rep (all 10 milestones)
INSERT INTO public.milestones (rep_id, step_number, template_id, completed)
SELECT 
  r.id,
  ct.milestone,
  ct.id,
  CASE 
    WHEN ct.milestone <= r.milestone THEN true
    ELSE false
  END
FROM public.reps r
CROSS JOIN public.checklist_templates ct;

-- Create milestone subtasks for each milestone
INSERT INTO public.milestone_subtasks (milestone_id, template_subtask_id, completed, completed_at, completed_by)
SELECT 
  m.id,
  cts.id,
  CASE 
    WHEN m.completed THEN true
    WHEN NOT m.completed AND ct.milestone = r.milestone THEN 
      CASE WHEN cts.order_index <= (r.overall_progress * 3 / 100) THEN true ELSE false END
    ELSE false
  END,
  CASE 
    WHEN m.completed OR (NOT m.completed AND ct.milestone = r.milestone AND cts.order_index <= (r.overall_progress * 3 / 100)) 
    THEN now() - interval '1 day' * random() * 30
    ELSE NULL
  END,
  CASE 
    WHEN m.completed OR (NOT m.completed AND ct.milestone = r.milestone AND cts.order_index <= (r.overall_progress * 3 / 100))
    THEN r.trainer_id
    ELSE NULL
  END
FROM public.milestones m
JOIN public.checklist_templates ct ON ct.id = m.template_id
JOIN public.checklist_template_subtasks cts ON cts.template_id = ct.id
JOIN public.reps r ON r.id = m.rep_id;