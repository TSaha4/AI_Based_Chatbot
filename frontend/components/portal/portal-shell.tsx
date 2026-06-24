"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard,
  Menu,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  Settings,
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
  { title: "Settings", href: "/settings", icon: Settings },
]

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="animate-logo-breathe flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-card shadow-sm">
        <Image
          src="/NTPC-Preview.png"
          alt="NTPC"
          width={32}
          height={32}
          className="h-7 w-auto object-contain"
          priority
        />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-foreground">
            NTPC Chatbot
          </span>
          <span className="text-xs text-sidebar-foreground/70">
            Joinee & trainee helpdesk
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
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-ring/15"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-0.5"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{item.title}</span>}
            {active && !collapsed && (
              <span className="ml-auto h-5 w-1 rounded-full bg-sidebar-primary" />
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

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    const root = document.documentElement
    if (savedTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }, [])

  return (
    <div
      className="ntpc-shell-bg flex min-h-svh w-full bg-background"
      style={{ ["--sidebar-offset" as string]: `${collapsed ? 76 : 264}px` }}
    >
      <div aria-hidden="true" className="thermal-backdrop">
        <div className="thermal-stack thermal-stack-secondary" />
        <div className="thermal-stack" />
        <div className="turbine-orbit" />
        <div className="heat-lines" />
      </div>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0, width: collapsed ? 76 : 264 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar/92 shadow-[8px_0_32px_rgb(0_135_201/6%)] backdrop-blur lg:flex"
      >
        <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed && "justify-center px-2")}>
          <Brand collapsed={collapsed} />
        </div>

        <div className="flex-1 p-3">
          <NavLinks collapsed={collapsed} />
        </div>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((value) => !value)}
            className={cn(
              "w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
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
      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{ paddingLeft: "var(--sidebar-offset)" }}
      >
        {/* Top navigation bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 shadow-[0_8px_28px_rgb(0_135_201/6%)] backdrop-blur supports-[backdrop-filter]:bg-card/78 md:px-6">
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
            <div className="animate-logo-breathe flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-card shadow-sm">
              <Image
                src="/NTPC-Preview.png"
                alt="NTPC"
                width={28}
                height={28}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
              NTPC AI Common Service Chatbot
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
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
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
