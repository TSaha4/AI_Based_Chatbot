"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import Image from "next/image"
import { Search, Mic, History, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AiResponse, TypingIndicator } from "@/components/dashboard/ai-response"
import { recentQuestions, suggestedTopics } from "@/lib/portal-data"
import { queryChatbot } from "@/lib/chat-api"
import type { AnswerResult } from "@/lib/mock-answer"

export default function DashboardPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const ask = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return

    setPendingQuery(trimmed)
    setLoading(true)
    setQuery("")
    setError(null)

    try {
      const response = await queryChatbot({ query: trimmed, sessionId })
      setResults((prev) => [...prev, response])
    } catch {
      setError("Unable to reach the assistant. Please check that the backend is running.")
    } finally {
      setLoading(false)
      setPendingQuery(null)
      requestAnimationFrame(() =>
        scrollRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        })
      )
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-120px)] w-full pb-32">
      {/* Welcome Screen & Suggested Topics (Shown only when no messages have been exchanged yet) */}
      {results.length === 0 && !pendingQuery && !error && (
        <div className="stagger-soft flex flex-col gap-10">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="ntpc-card overflow-hidden rounded-xl border border-primary/10 bg-card/92"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="animate-logo-breathe mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-card shadow-sm overflow-hidden">
                  <Image
                    src="/NTPC-Preview.png"
                    alt="NTPC"
                    width={32}
                    height={32}
                    className="h-7 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Welcome to NTPC support
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ask anything about joining, induction, training, safety, or HR
                    procedures. The assistant is set up for new joinees and trainees.
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="hidden border-primary/10 bg-secondary text-secondary-foreground sm:inline-flex">
                Calm NTPC workspace
              </Badge>
            </div>
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Start here
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Joining documents, ID setup, and first-day guidance.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Helpful
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Training schedules, safety basics, and plant familiarization.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ask casually
                </p>
                <p className="mt-1 text-sm text-foreground">
                  Short questions work best. Try one topic at a time.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Hero section */}
          <section className="flex flex-col items-center gap-6 pt-2 text-center">
            <div className="flex flex-col items-center gap-3">
              <Badge variant="secondary" className="ntpc-sheen gap-1.5 border-primary/10 bg-accent text-accent-foreground">
                <Image
                  src="/NTPC-Preview.png"
                  alt="NTPC"
                  width={14}
                  height={14}
                  className="size-3.5 object-contain"
                />
                NTPC onboarding assistant
              </Badge>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Ask common questions as you get started
              </h1>
              <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
                Get quick guidance on joining formalities, HR policies, safety
                basics, training processes, and everyday NTPC procedures.
              </p>
            </div>
          </section>

          {/* Suggested topics */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {suggestedTopics.map((topic) => (
              <motion.button
                key={topic}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                onClick={() => ask(`Tell me about ${topic.toLowerCase()}`)}
                className="rounded-full border border-primary/15 bg-card/88 px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors duration-200 hover:border-primary/40 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {topic}
              </motion.button>
            ))}
          </div>

          {/* Recent questions */}
          <section className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Questions
            </h2>
            <Card className="ntpc-card border-border bg-card/92">
              <CardContent className="p-2">
                <ul className="flex flex-col">
                  {recentQuestions.map((rq, i) => (
                    <li key={rq.id}>
                      <button
                        type="button"
                        onClick={() => ask(rq.question)}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-all duration-200 hover:translate-x-0.5 hover:bg-secondary cursor-pointer"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                          <History className="size-4" aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">
                            {rq.question}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {rq.time}
                          </span>
                        </span>
                      </button>
                      {i < recentQuestions.length - 1 && (
                        <div className="mx-3 border-t border-border" />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {/* ChatGPT conversation layout stream */}
      {(results.length > 0 || pendingQuery || error) && (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full">
          {/* Past conversation bubbles */}
          {results.map((res, idx) => (
            <div key={idx} className="w-full">
              <AiResponse result={res} sessionId={sessionId} />
            </div>
          ))}

          {/* Pending user query and typing indicator */}
          {pendingQuery && (
            <div className="flex flex-col gap-6 w-full">
              {/* User question on the right */}
              <div className="flex items-start justify-end gap-3 w-full animate-soft-rise">
                <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
                  {pendingQuery}
                </div>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm border border-border">
                  <User className="size-4" aria-hidden="true" />
                </div>
              </div>
              {/* Typing indicator */}
              <TypingIndicator />
            </div>
          )}

          {/* Error Message bubble */}
          {error && (
            <div className="flex flex-col gap-6 w-full animate-soft-rise">
              {pendingQuery && (
                <div className="flex items-start justify-end gap-3 w-full">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm">
                    {pendingQuery}
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm border border-border">
                    <User className="size-4" aria-hidden="true" />
                  </div>
                </div>
              )}
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
                <div className="flex-1 max-w-[85%]">
                  <Card className="border-destructive/30 bg-destructive/5 rounded-2xl rounded-tl-none shadow-sm">
                    <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} className="h-2" />
        </div>
      )}

      {/* Floating sticky input at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-6 px-4 lg:pl-[var(--sidebar-offset)]">
        <form
          className="animate-soft-rise flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-primary/10 bg-card/82 p-2 shadow-lg backdrop-blur sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            ask(query)
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about joining, training, leave, safety..."
              aria-label="Ask a question"
              className="h-12 border-transparent bg-transparent pl-10 pr-11 text-base shadow-none transition-shadow duration-200 focus-visible:shadow-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Voice search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Mic className="size-5" />
            </Button>
          </div>
          <Button
            type="submit"
            size="lg"
            className="ntpc-sheen h-12 px-6 shadow-md cursor-pointer"
            disabled={loading}
          >
            <Search data-icon="inline-start" />
            Ask Question
          </Button>
        </form>
      </div>
    </div>
  )
}
