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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
    <Card className="border-border">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
      </CardContent>
    </Card>
  )
}

function TicketCard({
  result,
}: {
  result: Extract<AnswerResult, { kind: "ticket" }>
}) {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldQuestion className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              Support Ticket Created
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The question has been forwarded for expert review.
            </p>
          </div>
        </div>

        <ConfidenceMeter score={result.confidence} />

        <Separator className="bg-amber-200" />

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Ticket ID
            </dt>
            <dd className="font-mono text-sm font-semibold text-foreground">
              {result.ticketId}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">
              Status
            </dt>
            <dd>
              <Badge variant="secondary">{result.status}</Badge>
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
        </dl>
      </CardContent>
    </Card>
  )
}

export function AiResponse({ result }: { result: AnswerResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      <QuestionBubble question={result.question} />
      {result.kind === "answer" ? (
        <AnswerCard result={result} />
      ) : (
        <TicketCard result={result} />
      )}
    </motion.div>
  )
}
