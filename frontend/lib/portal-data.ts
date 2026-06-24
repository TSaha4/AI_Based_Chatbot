export type NavItem = {
  title: string
  href: string
  icon: "dashboard" | "repository"
}

export const recentQuestions: { id: string; question: string; time: string }[] =
  [
    {
      id: "q1",
      question: "What documents do I need on my first joining day?",
      time: "2 hours ago",
    },
    {
      id: "q2",
      question: "How many casual leaves are allowed per calendar year?",
      time: "Yesterday",
    },
    {
      id: "q3",
      question: "What PPE is required during plant familiarization?",
      time: "2 days ago",
    },
    {
      id: "q4",
      question: "Where can trainees find their induction schedule?",
      time: "3 days ago",
    },
  ]

export const suggestedTopics: string[] = [
  "Joining Formalities",
  "Training Schedule",
  "HR Policies",
  "Safety Basics",
  "Plant Familiarization",
]

export type Category = {
  name: string
  description: string
  count: number
  icon: string
}

export const categories: Category[] = [
  {
    name: "Safety Documentation",
    description: "Safety basics, PPE, visitor and trainee precautions",
    count: 142,
    icon: "shield",
  },
  {
    name: "Technical Manuals",
    description: "Introductory manuals and plant familiarization guides",
    count: 318,
    icon: "wrench",
  },
  {
    name: "HR Policies",
    description: "Joining, leave, conduct, payroll, and benefits",
    count: 87,
    icon: "users",
  },
  {
    name: "Joining Formalities",
    description: "Documents, identity cards, reporting, and induction",
    count: 64,
    icon: "scale",
  },
  {
    name: "Training Procedures",
    description: "Induction, assessments, schedules, and nominations",
    count: 196,
    icon: "settings",
  },
  {
    name: "Operational Guidelines",
    description: "Basic SOPs, shift etiquette, and plant operations",
    count: 153,
    icon: "clipboard",
  },
]

export type DocStatus = "Published" | "Under Review" | "Draft"

export type Document = {
  id: string
  name: string
  category: string
  updated: string
  status: DocStatus
}

export const documents: Document[] = [
  {
    id: "DOC-2041",
    name: "Lockout-Tagout (LOTO) Standard Procedure",
    category: "Safety Documentation",
    updated: "12 Jun 2026",
    status: "Published",
  },
  {
    id: "DOC-1980",
    name: "Steam Turbine Operating Manual - Unit 4",
    category: "Technical Manuals",
    updated: "09 Jun 2026",
    status: "Published",
  },
  {
    id: "DOC-3122",
    name: "Leave & Attendance Policy 2026",
    category: "HR Policies",
    updated: "04 Jun 2026",
    status: "Under Review",
  },
  {
    id: "DOC-2765",
    name: "New Joinee Document Submission Checklist",
    category: "Joining Formalities",
    updated: "28 May 2026",
    status: "Published",
  },
  {
    id: "DOC-2210",
    name: "Induction Training Attendance Process",
    category: "Training Procedures",
    updated: "21 May 2026",
    status: "Draft",
  },
  {
    id: "DOC-1654",
    name: "Shift Handover Standard Operating Procedure",
    category: "Operational Guidelines",
    updated: "18 May 2026",
    status: "Published",
  },
  {
    id: "DOC-2899",
    name: "Personal Protective Equipment (PPE) Matrix",
    category: "Safety Documentation",
    updated: "15 May 2026",
    status: "Published",
  },
  {
    id: "DOC-3301",
    name: "Cooling Water Treatment Technical Guide",
    category: "Technical Manuals",
    updated: "11 May 2026",
    status: "Under Review",
  },
]

export const recentlyUpdated = documents.slice(0, 5)
