"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { Search, Mic, History, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuickAccess } from "@/components/dashboard/quick-access"
import { AiResponse, TypingIndicator } from "@/components/dashboard/ai-response"
import { generateAnswer, type AnswerResult } from "@/lib/mock-answer"
import { recentQuestions, suggestedTopics } from "@/lib/portal-data"

export default function DashboardPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const responseRef = useRef<HTMLDivElement>(null)

  const ask = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setResult(null)
    setLoading(true)
    setTimeout(() => {
      setResult(generateAnswer(trimmed))
      setLoading(false)
      requestAnimationFrame(() =>
        responseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      )
    }, 1600)
  }

  const focusSearch = () => {
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero + search */}
      <section className="flex flex-col items-center gap-6 pt-2 text-center">
        <div className="flex flex-col items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Enterprise Knowledge Assistant
          </Badge>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            AI Common Service Chatbot
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
            Search policies, procedures, manuals, technical documentation, and
            organizational knowledge.
          </p>
        </div>

        <form
          className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
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
              placeholder="Ask about safety, HR, technical manuals…"
              aria-label="Ask a question"
              className="h-12 pl-10 pr-11 text-base"
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
            className="h-12 px-6"
            disabled={loading}
          >
            <Search data-icon="inline-start" />
            Ask Question
          </Button>
        </form>

        {/* Suggested topics */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {suggestedTopics.map((topic) => (
            <motion.button
              key={topic}
              type="button"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.12 }}
              onClick={() => ask(`Tell me about ${topic.toLowerCase()}`)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
            >
              {topic}
            </motion.button>
          ))}
        </div>
      </section>

      {/* AI response / loading area */}
      {(loading || result) && (
        <section ref={responseRef} className="mx-auto w-full max-w-2xl scroll-mt-20">
          {loading ? <TypingIndicator /> : result && <AiResponse result={result} />}
        </section>
      )}

      {/* Quick access */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
        <QuickAccess onAskFocus={focusSearch} />
      </section>

      {/* Recent questions */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Questions
        </h2>
        <Card className="border-border">
          <CardContent className="p-2">
            <ul className="flex flex-col">
              {recentQuestions.map((rq, i) => (
                <li key={rq.id}>
                  <button
                    type="button"
                    onClick={() => ask(rq.question)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors hover:bg-secondary"
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
  )
}
