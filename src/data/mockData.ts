
import { Rep, Trainer, ChecklistItem } from '@/types';

// 10-milestone checklist template based on the provided table
export const checklistTemplate: Omit<ChecklistItem, 'id' | 'isCompleted' | 'completedDate'>[] = [
  {
    milestone: 1,
    title: "Orientation Kick-Off",
    description: "Initial setup and introduction to the program",
    subtasks: [
      { id: '1-1', title: 'Receive "A IBA Day" text', isCompleted: false },
      { id: '1-2', title: 'Download Primerica app', isCompleted: false },
      { id: '1-3', title: 'Create ExamFX login', isCompleted: false },
      { id: '1-4', title: 'Watch orientation video', isCompleted: false },
      { id: '1-5', title: 'Join Telegram and Facebook groups', isCompleted: false }
    ]
  },
  {
    milestone: 2,
    title: "Licensing Prep & Study",
    description: "Prepare for licensing and study requirements",
    subtasks: [
      { id: '2-1', title: 'Read Success Plan', isCompleted: false },
      { id: '2-2', title: 'Schedule ReferSecure.com appointment', isCompleted: false },
      { id: '2-3', title: 'Pass ExamFX Quiz #1', isCompleted: false },
      { id: '2-4', title: 'Join Pre-Licensing chat', isCompleted: false },
      { id: '2-5', title: 'Add Team Tenacious calendar', isCompleted: false }
    ]
  },
  {
    milestone: 3,
    title: "Market Launch Setup",
    description: "Set up marketing and social media presence",
    subtasks: [
      { id: '3-1', title: 'Share weekly open hours', isCompleted: false },
      { id: '3-2', title: 'Watch Facebook marketing video', isCompleted: false },
      { id: '3-3', title: 'Download Boards app', isCompleted: false },
      { id: '3-4', title: 'Make first Facebook post', isCompleted: false }
    ]
  },
  {
    milestone: 4,
    title: "Appointment Setting",
    description: "Learn to set and manage appointments",
    subtasks: [
      { id: '4-1', title: 'Watch market appointment video', isCompleted: false },
      { id: '4-2', title: 'Begin setting market appointments on own', isCompleted: false }
    ]
  },
  {
    milestone: 5,
    title: "Personal Plan (MASTER COPY)",
    description: "Complete personal insurance plan and analysis",
    subtasks: [
      { id: '5-1', title: 'Close Personal Term Life Plan', isCompleted: false },
      { id: '5-2', title: 'Review Financial Needs Analysis (FNA)', isCompleted: false },
      { id: '5-3', title: 'Become Master Copy', isCompleted: false }
    ]
  },
  {
    milestone: 6,
    title: "Team Tenacious Trainings",
    description: "Attend all required team training sessions",
    subtasks: [
      { id: '6-1', title: 'Attend TT Training #1', isCompleted: false },
      { id: '6-2', title: 'Attend TT Training #2', isCompleted: false },
      { id: '6-3', title: 'Attend TT Training #3', isCompleted: false }
    ]
  },
  {
    milestone: 7,
    title: "Sprint to District — Observation Phase ★ Target (S2D)",
    description: "Complete observation phase with trainer-run sessions",
    subtasks: [
      { id: '7-1', title: 'Interview Observation #1 (trainer-run)', isCompleted: false },
      { id: '7-2', title: 'Interview Observation #2 (trainer-run)', isCompleted: false },
      { id: '7-3', title: 'Interview Observation #3 (trainer-run)', isCompleted: false },
      { id: '7-4', title: 'Client-Experience Observation #1 (trainer-run)', isCompleted: false },
      { id: '7-5', title: 'Client-Experience Observation #2 (trainer-run)', isCompleted: false },
      { id: '7-6', title: 'Client-Experience Observation #3 (trainer-run)', isCompleted: false },
      { id: '7-7', title: '$3,000 in premiums reached', isCompleted: false }
    ]
  },
  {
    milestone: 8,
    title: "Interview Closes (3) - Target INDEPENDENT",
    description: "Complete interview closes independently to recruit new reps",
    subtasks: [
      { id: '8-1', title: 'Interview Close #1 (rep run)', isCompleted: false },
      { id: '8-2', title: 'Interview Close #2 (rep run)', isCompleted: false },
      { id: '8-3', title: 'Interview Close #3 (rep run)', isCompleted: false }
    ]
  },
  {
    milestone: 9,
    title: "Client-Experience Closes & Premium - Target INDEPENDENT",
    description: "Complete client experience closes independently",
    subtasks: [
      { id: '9-1', title: 'Close Client Experience #1', isCompleted: false },
      { id: '9-2', title: 'Close Client Experience #2', isCompleted: false },
      { id: '9-3', title: 'Close Client Experience #3', isCompleted: false }
    ]
  },
  {
    milestone: 10,
    title: "Licensing/INDEPENDENT Field-Trainer Ready",
    description: "Complete licensing and achieve independent status",
    subtasks: [
      { id: '10-1', title: 'Complete ExamFX training', isCompleted: false },
      { id: '10-2', title: 'Pass State Life Licensing Exam', isCompleted: false },
      { id: '10-3', title: 'Submit licensing paperwork and background check', isCompleted: false },
      { id: '10-4', title: 'Appointed by Primerica', isCompleted: false }
    ]
  }
];

export const mockTrainers: Trainer[] = [
  {
    id: 'trainer-1',
    name: 'Sarah Johnson',
    email: 'sarah@teamtenacious.com',
    assignedReps: 8,
    activeReps: 6,
    independentReps: 2,
    stuckReps: 1,
    averageTimeToIndependent: 28,
    successRate: 85
  },
  {
    id: 'trainer-2',
    name: 'Mike Chen',
    email: 'mike@teamtenacious.com',
    assignedReps: 6,
    activeReps: 4,
    independentReps: 1,
    stuckReps: 2,
    averageTimeToIndependent: 32,
    successRate: 78
  },
  {
    id: 'trainer-3',
    name: 'Lisa Rodriguez',
    email: 'lisa@teamtenacious.com',
    assignedReps: 10,
    activeReps: 8,
    independentReps: 3,
    stuckReps: 0,
    averageTimeToIndependent: 25,
    successRate: 92
  }
];

// Helper function to generate a complete checklist for a rep at a specific milestone
const generateChecklist = (milestone: number): ChecklistItem[] => {
  return checklistTemplate.map((template, index) => ({
    ...template,
    id: `checklist-${index + 1}`,
    isCompleted: index + 1 < milestone,
    completedDate: index + 1 < milestone ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    subtasks: template.subtasks.map(subtask => ({
      ...subtask,
      isCompleted: index + 1 < milestone || (index + 1 === milestone && Math.random() > 0.5),
      completedDate: index + 1 < milestone ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    }))
  }));
};

export const mockReps: Rep[] = [
  {
    id: 'rep-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '555-0101',
    trainerId: 'trainer-1',
    milestone: 6,
    status: 'Active',
    overallProgress: 55,
    dateAdded: '2024-05-15',
    lastActivity: '2024-06-22',
    checklist: generateChecklist(6)
  },
  {
    id: 'rep-2',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '555-0102',
    trainerId: 'trainer-1',
    milestone: 3,
    status: 'Stuck',
    overallProgress: 25,
    dateAdded: '2024-04-20',
    lastActivity: '2024-06-20',
    checklist: generateChecklist(3)
  },
  {
    id: 'rep-3',
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '555-0103',
    trainerId: 'trainer-2',
    milestone: 10,
    status: 'Independent',
    overallProgress: 100,
    dateAdded: '2024-03-10',
    lastActivity: '2024-06-24',
    checklist: generateChecklist(10)
  },
  {
    id: 'rep-4',
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '555-0104',
    trainerId: 'trainer-3',
    milestone: 4,
    status: 'Active',
    overallProgress: 35,
    dateAdded: '2024-05-01',
    lastActivity: '2024-06-24',
    checklist: generateChecklist(4)
  }
];
