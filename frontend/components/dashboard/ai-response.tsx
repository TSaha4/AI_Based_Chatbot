"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Bot,
  User,
  Copy,
  Check,
  FileText,
  ShieldQuestion,
  CircleCheck,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { createSupportTicket, isValidEmail } from "@/lib/chat-api"
import type { AnswerResult } from "@/lib/mock-answer"

function ConfidenceMeter({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-destructive"
  const label = score >= 80 ? "High" : score >= 60 ? "Moderate" : "Low"

  return (
    <div className="flex w-full max-w-xs flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">
          Confidence Score
        </span>
        <span className="font-semibold text-foreground">
          {score}% &middot; {label}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

function QuestionBubble({ question }: { question: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[85%] rounded-lg rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
        {question}
      </div>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <User className="size-4" aria-hidden="true" />
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <Card className="ntpc-card border-border bg-card/92">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="animate-logo-breathe flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-[260px] max-w-full" />
              <Skeleton className="h-3 w-[320px] max-w-full" />
              <Skeleton className="h-3 w-[180px] max-w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type FeedbackPhase =
  | "idle"
  | "helpful"
  | "ticket_prompt"
  | "email"
  | "ticket_created"
  | "declined"

function ResponseFeedback({
  question,
  sessionId,
}: {
  question: string
  sessionId: string
}) {
  const [phase, setPhase] = useState<FeedbackPhase>("idle")
  const [email, setEmail] = useState("")
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [ticketStatus, setTicketStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = isValidEmail(email)

  const raiseTicket = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError("")
    try {
      const ticket = await createSupportTicket({ question, email: email.trim(), sessionId })
      setTicketId(ticket.ticket_id)
      setTicketStatus(ticket.status)
      setPhase("ticket_created")
    } catch {
      setError("Ticket creation failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (phase === "helpful") {
    return (
      <p className="text-sm text-muted-foreground">Thanks for your feedback.</p>
    )
  }

  if (phase === "ticket_created" && ticketId) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3">
        <p className="text-sm font-medium text-foreground">Support ticket created successfully.</p>
        <p className="text-sm text-muted-foreground">
          Ticket ID: <span className="font-mono font-semibold text-foreground">{ticketId}</span>
          {ticketStatus ? ` · Status: ${ticketStatus}` : null}
        </p>
      </div>
    )
  }

  if (phase === "declined") {
    return (
      <p className="text-sm text-muted-foreground">No ticket was created.</p>
    )
  }

  if (phase === "ticket_prompt") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">
          Would you like to raise a support ticket?
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setPhase("email")}>
            Yes
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPhase("declined")}>
            No
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "email") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Enter your email to raise a support ticket</p>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@example.com"
          className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={raiseTicket} disabled={!canSubmit || submitting}>
            {submitting ? "Creating..." : "Submit ticket"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPhase("declined")}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">Was this answer helpful?</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPhase("helpful")}
          aria-label="Yes, this answer was helpful"
        >
          <ThumbsUp data-icon="inline-start" />
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPhase("ticket_prompt")}
          aria-label="No, this answer was not helpful"
        >
          <ThumbsDown data-icon="inline-start" />
          No
        </Button>
      </div>
    </div>
  )
}

function AnswerCard({
  result,
  sessionId,
}: {
  result: Extract<AnswerResult, { kind: "answer" }>
  sessionId: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card className="ntpc-card border-border bg-card/92">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="animate-logo-breathe flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot className="size-4" aria-hidden="true" />
          </div>
          <p className="pt-1 text-sm leading-relaxed text-foreground">
            {result.answer}
          </p>
        </div>

        <ConfidenceMeter score={result.confidence} />

        <Separator />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Source Documents
          </span>
          <ul className="flex flex-col gap-2">
            {result.sources.map((src) => (
              <li key={src.id + src.section}>
                <div className="flex items-start gap-2.5 rounded-md border border-border bg-secondary/50 px-3 py-2.5">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {src.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {src.id} &middot; {src.section}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Verified answer
          </Badge>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check data-icon="inline-start" />
            ) : (
              <Copy data-icon="inline-start" />
            )}
            {copied ? "Copied" : "Copy answer"}
          </Button>
        </div>

        <Separator />

        <ResponseFeedback question={result.question} sessionId={sessionId} />
      </CardContent>
    </Card>
  )
}

function TicketCard({
  result,
  sessionId,
}: {
  result: Extract<AnswerResult, { kind: "ticket" }>
  sessionId: string
}) {
  const [email, setEmail] = useState("")
  const [ticketId, setTicketId] = useState(result.ticketId ?? null)
  const [status, setStatus] = useState(result.status)
  const [submitting, setSubmitting] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = isValidEmail(email)

  const raiseTicket = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError("")
    try {
      const ticket = await createSupportTicket({
        question: result.question,
        email,
        sessionId,
      })
      setTicketId(ticket.ticket_id)
      setStatus(ticket.status)
    } catch {
      setError("Ticket creation failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldQuestion className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              {ticketId ? "Support Ticket Created" : "Support Ticket Suggested"}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {ticketId
                ? "The question has been forwarded for expert review."
                : result.message ?? "Would you like to raise a support ticket for admin review?"}
            </p>
          </div>
        </div>

        <ConfidenceMeter score={result.confidence} />

        <Separator className="bg-amber-200" />

        {!ticketId && !declined && (
          <div className="flex flex-col gap-3">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Enter your email"
              className="h-10 rounded-md border border-amber-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={raiseTicket} disabled={!canSubmit || submitting}>
                {submitting ? "Creating..." : "Yes, raise ticket"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeclined(true)}>
                No
              </Button>
            </div>
          </div>
        )}

        {declined && !ticketId && (
          <p className="text-sm text-muted-foreground">
            No ticket was created.
          </p>
        )}

        {ticketId && <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Ticket ID
            </dt>
            <dd className="font-mono text-sm font-semibold text-foreground">
              {ticketId}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Status
            </dt>
            <dd>
              <Badge variant="secondary">{status}</Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Estimated Review Time
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {result.estimatedReview}
            </dd>
          </div>
        </dl>}
      </CardContent>
    </Card>
  )
}

export function AiResponse({ result, sessionId }: { result: AnswerResult; sessionId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      <QuestionBubble question={result.question} />
      {result.kind === "answer" ? (
        <AnswerCard result={result} sessionId={sessionId} />
      ) : (
        <TicketCard result={result} sessionId={sessionId} />
      )}
    </motion.div>
  )
}
