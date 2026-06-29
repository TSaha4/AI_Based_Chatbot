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
      confidence: string
      sources: SourceDoc[]
    }
  | {
      kind: "ticket"
      question: string
      confidence: string
      ticketId?: string | null
      status: string
      estimatedReview: string
      message?: string
    }
