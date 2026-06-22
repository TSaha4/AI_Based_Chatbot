"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  Library,
  Menu,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  Bot,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Knowledge Repository", href: "/repository", icon: Library },
]

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Bot className="size-5" aria-hidden="true" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">
            Knowledge Portal
          </span>
          <span className="text-xs text-muted-foreground">
            Enterprise KMS
          </span>
        </div>
      )}
    </div>
  )
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
        const Icon = item.icon

        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{item.title}</span>}
            {active && !collapsed && (
              <span className="ml-auto h-5 w-1 rounded-full bg-primary" />
            )}
          </Link>
        )

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          )
        }
        return link
      })}
    </nav>
  )
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-sidebar lg:flex"
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-4",
            collapsed && "justify-center px-2"
          )}
        >
          <Brand collapsed={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks collapsed={collapsed} />
        </div>

        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "w-full text-muted-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="size-5" data-icon="inline-start" />
            ) : (
              <>
                <PanelLeftClose className="size-5" data-icon="inline-start" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </motion.aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="h-16 justify-center border-b border-border px-4">
                <SheetTitle className="text-left">
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
              <Bot className="size-5" aria-hidden="true" />
            </div>
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
              AI Common Service Chatbot
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Help and support"
                  >
                    <HelpCircle className="size-5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Help &amp; Support</TooltipContent>
            </Tooltip>
            <div
              className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
              aria-hidden="true"
            >
              RK
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
