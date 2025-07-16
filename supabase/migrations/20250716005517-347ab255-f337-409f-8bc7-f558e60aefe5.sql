-- Clear existing data and populate correct 10-milestone checklist
DELETE FROM milestone_subtasks;
DELETE FROM milestones;
DELETE FROM checklist_template_subtasks;
DELETE FROM checklist_templates;

-- Insert the 10 milestones
INSERT INTO checklist_templates (milestone, title, description) VALUES 
(1, 'Orientation Kick-Off', 'Complete initial orientation and setup'),
(2, 'Licensing Prep & Study', 'Prepare for licensing exam and study materials'),
(3, 'Market Launch Setup', 'Set up marketing tools and social media presence'),
(4, 'Appointment Setting', 'Learn and begin setting market appointments'),
(5, 'Personal Plan (MASTER COPY)', 'Complete personal financial plan and become Master Copy'),
(6, 'Team Tenacious Trainings', 'Attend required Team Tenacious training sessions'),
(7, 'Sprint to District — Observation Phase ★ Target (S2D)', 'Complete observation phase with trainer-run sessions'),
(8, 'Interview Closes (3) - recruit new reps Target- INDEPENDENT', 'Complete independent interview closes'),
(9, 'Client-Experience Closes & Premium Target- INDEPENDENT', 'Complete client experience closes independently'),
(10, 'Licensing/INDEPENDENT Field-Trainer Ready', 'Complete licensing and become independent field-trainer ready');

-- Insert subtasks for each milestone
-- Milestone 1: Orientation Kick-Off
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Receive "A IBA Day" text', 1 FROM checklist_templates WHERE milestone = 1;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Download Primerica app', 2 FROM checklist_templates WHERE milestone = 1;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Create ExamFX login', 3 FROM checklist_templates WHERE milestone = 1;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Watch orientation video', 4 FROM checklist_templates WHERE milestone = 1;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Join Telegram and Facebook groups', 5 FROM checklist_templates WHERE milestone = 1;

-- Milestone 2: Licensing Prep & Study
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Read Success Plan', 1 FROM checklist_templates WHERE milestone = 2;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Schedule ReferSecure.com appointment', 2 FROM checklist_templates WHERE milestone = 2;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Pass ExamFX Quiz #1', 3 FROM checklist_templates WHERE milestone = 2;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Join Pre-Licensing chat', 4 FROM checklist_templates WHERE milestone = 2;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Add Team Tenacious calendar', 5 FROM checklist_templates WHERE milestone = 2;

-- Milestone 3: Market Launch Setup
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Share weekly open hours', 1 FROM checklist_templates WHERE milestone = 3;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Watch Facebook marketing video', 2 FROM checklist_templates WHERE milestone = 3;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Download Boards app', 3 FROM checklist_templates WHERE milestone = 3;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Make first Facebook post', 4 FROM checklist_templates WHERE milestone = 3;

-- Milestone 4: Appointment Setting
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Watch market appointment video', 1 FROM checklist_templates WHERE milestone = 4;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Begin setting market appointments on own', 2 FROM checklist_templates WHERE milestone = 4;

-- Milestone 5: Personal Plan (MASTER COPY)
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Close Personal Term Life Plan', 1 FROM checklist_templates WHERE milestone = 5;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Review Financial Needs Analysis (FNA)', 2 FROM checklist_templates WHERE milestone = 5;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Become Master Copy', 3 FROM checklist_templates WHERE milestone = 5;

-- Milestone 6: Team Tenacious Trainings
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Attend TT Training #1', 1 FROM checklist_templates WHERE milestone = 6;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Attend TT Training #2', 2 FROM checklist_templates WHERE milestone = 6;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Attend TT Training #3', 3 FROM checklist_templates WHERE milestone = 6;

-- Milestone 7: Sprint to District — Observation Phase
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Observation #1 (trainer-run)', 1 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Observation #2 (trainer-run)', 2 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Observation #3 (trainer-run)', 3 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Client-Experience Observation #1 (trainer-run)', 4 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Client-Experience Observation #2 (trainer-run)', 5 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Client-Experience Observation #3 (trainer-run)', 6 FROM checklist_templates WHERE milestone = 7;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, '$3,000 in premiums reached', 7 FROM checklist_templates WHERE milestone = 7;

-- Milestone 8: Interview Closes (3)
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Close #1 (rep run)', 1 FROM checklist_templates WHERE milestone = 8;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Close #2 (rep run)', 2 FROM checklist_templates WHERE milestone = 8;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Interview Close #3 (rep run)', 3 FROM checklist_templates WHERE milestone = 8;

-- Milestone 9: Client-Experience Closes & Premium
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Close Client Experience #1', 1 FROM checklist_templates WHERE milestone = 9;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Close Client Experience #2', 2 FROM checklist_templates WHERE milestone = 9;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Close Client Experience #3', 3 FROM checklist_templates WHERE milestone = 9;

-- Milestone 10: Licensing/INDEPENDENT Field-Trainer Ready
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Complete ExamFX training', 1 FROM checklist_templates WHERE milestone = 10;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Pass State Life Licensing Exam', 2 FROM checklist_templates WHERE milestone = 10;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Submit licensing paperwork and background check', 3 FROM checklist_templates WHERE milestone = 10;
INSERT INTO checklist_template_subtasks (template_id, title, order_index) 
SELECT id, 'Appointed by Primerica', 4 FROM checklist_templates WHERE milestone = 10;