export type NavItem = {
  title: string
  href: string
  icon: "dashboard" | "repository"
}

export const recentQuestions: { id: string; question: string; time: string }[] =
  [
    {
      id: "q1",
      question: "What is the lockout-tagout procedure for turbine maintenance?",
      time: "2 hours ago",
    },
    {
      id: "q2",
      question: "How many casual leaves are allowed per calendar year?",
      time: "Yesterday",
    },
    {
      id: "q3",
      question: "What are the PPE requirements for the boiler area?",
      time: "2 days ago",
    },
    {
      id: "q4",
      question: "What is the escalation matrix for compliance violations?",
      time: "3 days ago",
    },
  ]

export const suggestedTopics: string[] = [
  "Safety Procedures",
  "Technical Manuals",
  "HR Policies",
  "Compliance Guidelines",
  "Operational Processes",
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
    description: "Workplace safety standards, PPE, hazard controls",
    count: 142,
    icon: "shield",
  },
  {
    name: "Technical Manuals",
    description: "Equipment manuals, schematics, operating guides",
    count: 318,
    icon: "wrench",
  },
  {
    name: "HR Policies",
    description: "Leave, payroll, code of conduct, benefits",
    count: 87,
    icon: "users",
  },
  {
    name: "Compliance",
    description: "Regulatory standards, audits, statutory norms",
    count: 64,
    icon: "scale",
  },
  {
    name: "Maintenance Procedures",
    description: "Preventive and corrective maintenance workflows",
    count: 196,
    icon: "settings",
  },
  {
    name: "Operational Guidelines",
    description: "SOPs, shift handover, plant operations",
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
    name: "Steam Turbine Operating Manual — Unit 4",
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
    name: "Environmental Compliance Audit Checklist",
    category: "Compliance",
    updated: "28 May 2026",
    status: "Published",
  },
  {
    id: "DOC-2210",
    name: "Boiler Preventive Maintenance Schedule",
    category: "Maintenance Procedures",
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
