"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  MessageSquarePlus,
  Library,
  History,
  TicketCheck,
  type LucideIcon,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

type Action = {
  title: string
  description: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
}

export function QuickAccess({
  onAskFocus,
}: {
  onAskFocus?: () => void
}) {
  const actions: Action[] = [
    {
      title: "Ask a Question",
      description: "Get instant AI-powered answers",
      icon: MessageSquarePlus,
      onClick: onAskFocus,
    },
    {
      title: "Browse Knowledge Base",
      description: "Explore documents by category",
      icon: Library,
      href: "/repository",
    },
    {
      title: "Recent Queries",
      description: "Revisit your recent questions",
      icon: History,
      onClick: onAskFocus,
    },
    {
      title: "Open Tickets",
      description: "2 questions under expert review",
      icon: TicketCheck,
      onClick: onAskFocus,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon
        const inner = (
          <Card className="h-full cursor-pointer border-border transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {action.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )

        return (
          <motion.div
            key={action.title}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            {action.href ? (
              <Link href={action.href} className="block h-full">
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="block h-full w-full text-left"
              >
                {inner}
              </button>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
