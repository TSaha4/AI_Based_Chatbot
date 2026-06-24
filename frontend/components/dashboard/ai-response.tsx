"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "motion/react"
import {
  User,
  Copy,
  Check,
  FileText,
  ShieldQuestion,
  CircleCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { createSupportTicket } from "@/lib/chat-api"
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



export function TypingIndicator() {
  return (
    <div className="flex items-start justify-start gap-3 w-full">
      <div className="animate-logo-breathe flex size-8 shrink-0 items-center justify-center rounded-full bg-card border border-primary/15 overflow-hidden shadow-sm">
        <Image
          src="/NTPC-Preview.png"
          alt="NTPC"
          width={20}
          height={20}
          className="h-5 w-auto object-contain"
        />
      </div>
      <Card className="ntpc-card border-border bg-card/92 max-w-[85%] flex-1 rounded-2xl rounded-tl-none shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3">
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
        </CardContent>
      </Card>
    </div>
  )
}

function AnswerCard({
  result,
}: {
  result: Extract<AnswerResult, { kind: "answer" }>
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
    <Card className="ntpc-card border-border bg-card/92 rounded-2xl rounded-tl-none shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm leading-relaxed text-foreground">
          {result.answer}
        </p>

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

  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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
    <Card className="border-amber-300 bg-amber-50 rounded-2xl rounded-tl-none shadow-sm">
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
                : "Would you like to raise a support ticket for admin review?"}
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
      className="flex flex-col gap-6"
    >
      {/* Question bubble on the right */}
      <div className="flex items-start justify-end gap-3 w-full">
        <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm animate-soft-rise">
          {result.question}
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm border border-border">
          <User className="size-4" aria-hidden="true" />
        </div>
      </div>

      {/* Answer on the left */}
      <div className="flex items-start justify-start gap-3 w-full">
        <div className="animate-logo-breathe flex size-8 shrink-0 items-center justify-center rounded-full bg-card border border-primary/15 overflow-hidden shadow-sm">
          <Image
            src="/NTPC-Preview.png"
            alt="NTPC"
            width={20}
            height={20}
            className="h-5 w-auto object-contain"
          />
        </div>
        <div className="flex-1 max-w-[85%] animate-soft-rise">
          {result.kind === "answer" ? (
            <AnswerCard result={result} />
          ) : (
            <TicketCard result={result} sessionId={sessionId} />
          )}
        </div>
      </div>
    </motion.div>
  )
}
