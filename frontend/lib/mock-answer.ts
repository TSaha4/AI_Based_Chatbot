export type SourceDoc = {
  id: string
  title: string
  section: string
}

export type AnswerResult =
  | {
      kind: "answer"
      question: string
      answer: string
      confidence: number
      sources: SourceDoc[]
    }
  | {
      kind: "ticket"
      question: string
      confidence: number
      ticketId: string
      status: string
      estimatedReview: string
    }

const KNOWLEDGE: {
  match: string[]
  answer: string
  confidence: number
  sources: SourceDoc[]
}[] = [
  {
    match: ["lockout", "tagout", "loto", "turbine", "safety"],
    answer:
      "The Lockout-Tagout (LOTO) procedure requires isolating all energy sources before turbine maintenance. Authorized personnel must apply individual locks and tags, verify zero-energy state with a test instrument, and record the isolation in the permit-to-work register. Locks may only be removed by the person who applied them after work completion and area clearance.",
    confidence: 96,
    sources: [
      { id: "DOC-2041", title: "Lockout-Tagout (LOTO) Standard Procedure", section: "Section 3.2 — Energy Isolation" },
      { id: "DOC-1980", title: "Steam Turbine Operating Manual — Unit 4", section: "Chapter 7 — Maintenance Safety" },
    ],
  },
  {
    match: ["leave", "casual", "attendance", "holiday", "hr", "policies"],
    answer:
      "Employees are entitled to 12 casual leaves per calendar year, accrued at 1 per month. Casual leave cannot be combined with earned leave and must be applied for at least one working day in advance through the HR portal, except in emergencies. Unused casual leave lapses at year end and is not encashable.",
    confidence: 91,
    sources: [
      { id: "DOC-3122", title: "Leave & Attendance Policy 2026", section: "Section 4 — Casual Leave" },
    ],
  },
  {
    match: [
      "ppe",
      "protective",
      "boiler",
      "equipment",
      "helmet",
      "technical",
      "manual",
    ],
    answer:
      "Personnel entering the boiler area must wear a hard hat, flame-resistant coveralls, safety goggles, ear protection, and steel-toe boots. Respiratory protection is mandatory during ash handling. PPE must be inspected before each shift, and any damaged equipment reported and replaced immediately.",
    confidence: 94,
    sources: [
      { id: "DOC-2899", title: "Personal Protective Equipment (PPE) Matrix", section: "Zone B — High Temperature Areas" },
      { id: "DOC-2041", title: "Lockout-Tagout (LOTO) Standard Procedure", section: "Appendix A" },
    ],
  },
  {
    match: ["compliance", "escalation", "audit", "violation", "regulatory"],
    answer:
      "Compliance violations follow a three-tier escalation matrix. Level 1 issues are addressed by the unit supervisor within 24 hours, Level 2 issues are escalated to the compliance officer within 48 hours, and Level 3 (statutory) issues are reported to the regulatory affairs head immediately and logged in the central compliance register.",
    confidence: 88,
    sources: [
      { id: "DOC-2765", title: "Environmental Compliance Audit Checklist", section: "Section 2 — Escalation" },
    ],
  },
  {
    match: ["shift", "handover", "operation", "operational", "sop", "process"],
    answer:
      "Shift handover must be documented in the handover log and verbally communicated to the incoming operator. The log must capture equipment status, pending tasks, abnormal conditions, and outstanding permits. Both outgoing and incoming operators sign the log to confirm transfer of responsibility.",
    confidence: 90,
    sources: [
      { id: "DOC-1654", title: "Shift Handover Standard Operating Procedure", section: "Section 1 — Handover Protocol" },
    ],
  },
]

export function generateAnswer(question: string): AnswerResult {
  const q = question.toLowerCase()
  const hit = KNOWLEDGE.find((k) => k.match.some((m) => q.includes(m)))

  if (hit) {
    return {
      kind: "answer",
      question,
      answer: hit.answer,
      confidence: hit.confidence,
      sources: hit.sources,
    }
  }

  return {
    kind: "ticket",
    question,
    confidence: 38,
    ticketId: `TKT-${Math.floor(100000 + Math.random() * 899999)}`,
    status: "Forwarded for Expert Review",
    estimatedReview: "Within 1 business day",
  }
}
