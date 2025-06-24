
import { Rep, Trainer, ChecklistItem } from '@/types';

// 13-step checklist template
export const checklistTemplate: Omit<ChecklistItem, 'id' | 'isCompleted' | 'completedDate'>[] = [
  {
    stage: 1,
    title: "Welcome & Onboarding",
    description: "Initial setup and introduction to the program",
    subtasks: [
      { id: '1-1', title: "Complete welcome call", isCompleted: false },
      { id: '1-2', title: "Set up workspace", isCompleted: false },
      { id: '1-3', title: "Review program materials", isCompleted: false }
    ]
  },
  {
    stage: 2,
    title: "Basic Training",
    description: "Learn fundamental skills and processes",
    subtasks: [
      { id: '2-1', title: "Complete training modules 1-3", isCompleted: false },
      { id: '2-2', title: "Pass basic knowledge quiz", isCompleted: false },
      { id: '2-3', title: "Practice role-play scenarios", isCompleted: false }
    ]
  },
  {
    stage: 3,
    title: "Product Knowledge",
    description: "Master product features and benefits",
    subtasks: [
      { id: '3-1', title: "Study product catalog", isCompleted: false },
      { id: '3-2', title: "Complete product quiz", isCompleted: false },
      { id: '3-3', title: "Shadow experienced rep", isCompleted: false }
    ]
  },
  {
    stage: 4,
    title: "Sales Fundamentals",
    description: "Learn core sales techniques",
    subtasks: [
      { id: '4-1', title: "Complete sales training", isCompleted: false },
      { id: '4-2', title: "Practice pitch delivery", isCompleted: false },
      { id: '4-3', title: "Learn objection handling", isCompleted: false }
    ]
  },
  {
    stage: 5,
    title: "Field Practice",
    description: "Apply skills in real scenarios",
    subtasks: [
      { id: '5-1', title: "Complete 5 practice calls", isCompleted: false },
      { id: '5-2', title: "Receive feedback session", isCompleted: false },
      { id: '5-3', title: "Improve based on feedback", isCompleted: false }
    ]
  },
  {
    stage: 6,
    title: "Client Interaction",
    description: "Begin working with real clients",
    subtasks: [
      { id: '6-1', title: "Make first client contact", isCompleted: false },
      { id: '6-2', title: "Complete needs assessment", isCompleted: false },
      { id: '6-3', title: "Present initial proposal", isCompleted: false }
    ]
  },
  {
    stage: 7,
    title: "Lead Generation",
    description: "Learn to find and qualify prospects",
    subtasks: [
      { id: '7-1', title: "Set up lead sources", isCompleted: false },
      { id: '7-2', title: "Complete 10 cold calls", isCompleted: false },
      { id: '7-3', title: "Generate 5 qualified leads", isCompleted: false }
    ]
  },
  {
    stage: 8,
    title: "Closing Techniques",
    description: "Master the art of closing deals",
    subtasks: [
      { id: '8-1', title: "Learn closing techniques", isCompleted: false },
      { id: '8-2', title: "Practice with trainer", isCompleted: false },
      { id: '8-3', title: "Close first deal", isCompleted: false }
    ]
  },
  {
    stage: 9,
    title: "Pipeline Management",
    description: "Organize and track opportunities",
    subtasks: [
      { id: '9-1', title: "Set up CRM system", isCompleted: false },
      { id: '9-2', title: "Track all prospects", isCompleted: false },
      { id: '9-3', title: "Weekly pipeline review", isCompleted: false }
    ]
  },
  {
    stage: 10,
    title: "Advanced Skills",
    description: "Develop sophisticated techniques",
    subtasks: [
      { id: '10-1', title: "Advanced negotiation training", isCompleted: false },
      { id: '10-2', title: "Complex deal management", isCompleted: false },
      { id: '10-3', title: "Team collaboration skills", isCompleted: false }
    ]
  },
  {
    stage: 11,
    title: "Performance Metrics",
    description: "Track and improve key metrics",
    subtasks: [
      { id: '11-1', title: "Set performance goals", isCompleted: false },
      { id: '11-2', title: "Weekly metrics review", isCompleted: false },
      { id: '11-3', title: "Improvement action plan", isCompleted: false }
    ]
  },
  {
    stage: 12,
    title: "Independence Prep",
    description: "Prepare for independent work",
    subtasks: [
      { id: '12-1', title: "Solo client management", isCompleted: false },
      { id: '12-2', title: "Self-directed planning", isCompleted: false },
      { id: '12-3', title: "Peer mentoring skills", isCompleted: false }
    ]
  },
  {
    stage: 13,
    title: "Independent Status",
    description: "Achieve full independence",
    subtasks: [
      { id: '13-1', title: "Final performance review", isCompleted: false },
      { id: '13-2', title: "Independence certification", isCompleted: false },
      { id: '13-3', title: "Transition to independent", isCompleted: false }
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

const generateChecklist = (stage: number): ChecklistItem[] => {
  return checklistTemplate.map((template, index) => ({
    ...template,
    id: `checklist-${index + 1}`,
    isCompleted: index + 1 < stage,
    completedDate: index + 1 < stage ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    subtasks: template.subtasks.map(subtask => ({
      ...subtask,
      isCompleted: index + 1 < stage || (index + 1 === stage && Math.random() > 0.5),
      completedDate: index + 1 < stage ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
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
    stage: 8,
    status: 'Active',
    overallProgress: 65,
    dateAdded: '2024-05-15',
    lastActivity: '2024-06-22',
    checklist: generateChecklist(8)
  },
  {
    id: 'rep-2',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '555-0102',
    trainerId: 'trainer-1',
    stage: 4,
    status: 'Stuck',
    overallProgress: 25,
    dateAdded: '2024-04-20',
    lastActivity: '2024-06-20',
    checklist: generateChecklist(4)
  },
  {
    id: 'rep-3',
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '555-0103',
    trainerId: 'trainer-2',
    stage: 13,
    status: 'Independent',
    overallProgress: 100,
    dateAdded: '2024-03-10',
    lastActivity: '2024-06-24',
    checklist: generateChecklist(13)
  },
  {
    id: 'rep-4',
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '555-0104',
    trainerId: 'trainer-3',
    stage: 6,
    status: 'Active',
    overallProgress: 45,
    dateAdded: '2024-05-01',
    lastActivity: '2024-06-24',
    checklist: generateChecklist(6)
  }
];
