"use client"

import { motion } from "motion/react"
import {
  Shield,
  Wrench,
  Users,
  Scale,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { categories } from "@/lib/portal-data"

const ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  wrench: Wrench,
  users: Users,
  scale: Scale,
  settings: Settings,
  clipboard: ClipboardList,
}

export function CategoryCards({
  active,
  onSelect,
}: {
  active: string
  onSelect: (name: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => {
        const Icon = ICONS[cat.icon] ?? Shield
        const isActive = active === cat.name
        return (
          <motion.button
            key={cat.name}
            type="button"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelect(isActive ? "All" : cat.name)}
            className="text-left"
            aria-pressed={isActive}
          >
            <Card
              className={cn(
                "h-full border-border transition-shadow hover:shadow-md",
                isActive && "border-primary ring-1 ring-primary"
              )}
            >
              <CardContent className="flex h-full items-start gap-3 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {cat.name}
                    </h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {cat.count}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {cat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        )
      })}
    </div>
  )
}
