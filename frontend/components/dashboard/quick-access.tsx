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
      description: "Get quick help on common joining doubts",
      icon: MessageSquarePlus,
      onClick: onAskFocus,
    },
    {
      title: "Browse Knowledge Base",
      description: "Explore policies, SOPs, and training material",
      icon: Library,
      href: "/repository",
    },
    {
      title: "Recent Queries",
      description: "Revisit onboarding and trainee questions",
      icon: History,
      onClick: onAskFocus,
    },
    {
      title: "Open Tickets",
      description: "Questions forwarded for expert review",
      icon: TicketCheck,
      onClick: onAskFocus,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon
        const inner = (
          <Card className="ntpc-card h-full cursor-pointer border-border bg-card/92">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-md bg-accent text-primary shadow-[0_8px_20px_rgb(0_135_201/10%)] transition-transform duration-200 group-hover/card:scale-105">
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
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
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
