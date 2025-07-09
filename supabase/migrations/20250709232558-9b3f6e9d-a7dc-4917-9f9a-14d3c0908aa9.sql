-- Phase 4: Seed the database with test data (corrected)

-- Insert checklist templates (the 10 milestones from mock data)
INSERT INTO public.checklist_templates (milestone, title, description) VALUES
(1, 'Initial Setup & Licensing', 'Complete initial setup, licensing requirements, and basic training'),
(2, 'Basic Training Completion', 'Complete foundational training modules and assessments'),
(3, 'First Client Contact', 'Make initial client contact and complete first practice session'),
(4, 'Product Knowledge Assessment', 'Demonstrate understanding of products and services offered'),
(5, 'Compliance Training', 'Complete all required compliance and regulatory training'),
(6, 'Mentor Assignment', 'Get assigned to a mentor and complete initial mentoring session'),
(7, 'First Sale Preparation', 'Prepare for first sale including role-playing and practice'),
(8, 'Client Presentation', 'Deliver first client presentation with mentor supervision'),
(9, 'Sales Process Mastery', 'Demonstrate mastery of the complete sales process'),
(10, 'Independent Status', 'Complete all requirements and achieve independent status');

-- Insert subtasks for each milestone (based on mock data structure)
INSERT INTO public.checklist_template_subtasks (template_id, title, order_index)
SELECT 
  ct.id,
  subtask.title,
  subtask.order_index
FROM public.checklist_templates ct
CROSS JOIN (
  VALUES 
    -- Milestone 1 subtasks
    (1, 'Complete application paperwork', 1),
    (1, 'Submit background check', 2),
    (1, 'Complete initial online training', 3),
    -- Milestone 2 subtasks  
    (2, 'Complete product knowledge modules', 1),
    (2, 'Pass basic assessment test', 2),
    (2, 'Review company policies', 3),
    -- Milestone 3 subtasks
    (3, 'Practice client communication scripts', 1),
    (3, 'Make first client contact call', 2),
    (3, 'Complete contact documentation', 3),
    -- Milestone 4 subtasks
    (4, 'Study product comparison charts', 1),
    (4, 'Complete product knowledge quiz', 2),
    (4, 'Practice product presentations', 3),
    -- Milestone 5 subtasks
    (5, 'Complete compliance training modules', 1),
    (5, 'Pass compliance exam', 2),
    (5, 'Sign compliance agreements', 3),
    -- Milestone 6 subtasks
    (6, 'Meet assigned mentor', 1),
    (6, 'Set mentoring schedule', 2),
    (6, 'Complete first mentoring session', 3),
    -- Milestone 7 subtasks
    (7, 'Practice sales presentations', 1),
    (7, 'Role-play objection handling', 2),
    (7, 'Review closing techniques', 3),
    -- Milestone 8 subtasks
    (8, 'Prepare client presentation materials', 1),
    (8, 'Deliver presentation with mentor', 2),
    (8, 'Complete presentation feedback', 3),
    -- Milestone 9 subtasks
    (9, 'Demonstrate prospecting skills', 1),
    (9, 'Complete full sales cycle', 2),
    (9, 'Pass sales process evaluation', 3),
    -- Milestone 10 subtasks
    (10, 'Complete final assessment', 1),
    (10, 'Submit independence application', 2),
    (10, 'Receive independent status approval', 3)
) AS subtask(milestone, title, order_index)
WHERE ct.milestone = subtask.milestone;

-- Insert test reps with current user as trainer (based on mock data)
-- We'll use the current authenticated user as the trainer for all test reps
INSERT INTO public.reps (id, trainer_id, full_name, email, phone, address, milestone, status, overall_progress, join_date, last_activity)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'John Smith', 'john.smith@email.com', '(555) 123-4567', '123 Main St, Anytown, ST 12345', 3, 'Active', 30, '2024-01-15', now() - interval '2 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Jane Doe', 'jane.doe@email.com', '(555) 234-5678', '456 Oak Ave, Somewhere, ST 67890', 7, 'Active', 70, '2024-02-20', now() - interval '1 day'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Bob Johnson', 'bob.johnson@email.com', '(555) 345-6789', '789 Pine St, Elsewhere, ST 13579', 10, 'Independent', 100, '2023-12-10', now() - interval '7 days'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Alice Brown', 'alice.brown@email.com', '(555) 456-7890', '321 Elm St, Nowhere, ST 24680', 5, 'Active', 50, '2024-03-01', now() - interval '3 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Charlie Wilson', 'charlie.wilson@email.com', '(555) 567-8901', '654 Maple Ave, Anywhere, ST 97531', 2, 'Stuck', 20, '2024-01-20', now() - interval '5 days'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Diana Taylor', 'diana.taylor@email.com', '(555) 678-9012', '987 Cedar St, Someplace, ST 86420', 8, 'Active', 80, '2024-02-15', now() - interval '1 day'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Frank Miller', 'frank.miller@email.com', '(555) 789-0123', '147 Birch Ave, Nowhere, ST 75319', 10, 'Independent', 100, '2023-11-30', now() - interval '10 days'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'Grace Davis', 'grace.davis@email.com', '(555) 890-1234', '258 Spruce St, Everywhere, ST 64208', 6, 'Active', 60, '2024-03-10', now() - interval '2 days');

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
CROSS JOIN public.checklist_templates ct
WHERE r.id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh');

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
JOIN public.reps r ON r.id = m.rep_id
WHERE r.id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh');

-- Create a trainer record for the current user
INSERT INTO public.trainers (user_id, full_name, email, assigned_reps, active_reps, independent_reps, stuck_reps, average_time_to_independent, success_rate)
VALUES
('6f5e4ec9-ff20-4eab-a1db-3edc3db3723a', 'jeremyrpittman@gmail.com', 'jeremyrpittman@gmail.com', 8, 5, 2, 1, 28.5, 85.0);