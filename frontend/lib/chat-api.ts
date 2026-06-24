import type { AnswerResult, SourceDoc } from "@/lib/mock-answer"

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

type BackendSource = {
  id: string
  collection: string
  topic?: string | null
  score: number
  preview: string
}

type BackendConfidence = {
  label: string
  score: number
  ticket_required: boolean
}

type BackendChatResponse = {
  answer: string
  mapped_topic?: string | null
  confidence: BackendConfidence
  ticket_required: boolean
  ticket_suggested?: boolean
  ticket_id?: string | null
  cached: boolean
  sources: BackendSource[]
  session_id?: string | null
}

type BackendTicketResponse = {
  ticket_id: string
  status: string
  created_at: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

function mapSources(sources: BackendSource[]): SourceDoc[] {
  return sources.map((source) => ({
    id: source.id,
    title: source.topic || source.collection,
    section: source.collection,
  }))
}

export async function queryChatbot(input: {
  query: string
  sessionId: string
  email?: string
}): Promise<AnswerResult> {
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: input.query,
        session_id: input.sessionId,
        email: input.email,
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend request failed with ${response.status}`)
    }

    const data = (await response.json()) as BackendChatResponse
    const confidence = Math.round((data.confidence?.score ?? 0) * 100)

    if (data.ticket_suggested || data.ticket_required) {
      return {
        kind: "ticket",
        question: input.query,
        confidence,
        ticketId: data.ticket_id ?? null,
        status: "Ticket suggested",
        estimatedReview: "Within 1 business day",
        message: data.answer,
      }
    }

    return {
      kind: "answer",
      question: input.query,
      answer: data.answer,
      confidence,
      sources: mapSources(data.sources ?? []),
    }
  } catch (error) {
    console.error("Chat backend unavailable:", error)
    throw error instanceof Error ? error : new Error("Chat backend unavailable")
  }
}

export async function createSupportTicket(input: {
  question: string
  email: string
  sessionId: string
}): Promise<BackendTicketResponse> {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/chat/ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: input.question,
      email: input.email,
      session_id: input.sessionId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ticket request failed with ${response.status}`)
  }

  return response.json() as Promise<BackendTicketResponse>
}
