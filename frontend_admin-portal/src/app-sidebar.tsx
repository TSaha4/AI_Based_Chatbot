import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NtpcLogo } from "./components/ntpc-logo";

export const adminNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Ticket Management", icon: Ticket },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/settings", label: "System Settings", icon: Settings },
] as const;

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="ntpc-card fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-sidebar-border bg-sidebar md:flex"
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {collapsed ? (
          <div className="animate-logo-breathe flex h-8 w-8 items-center justify-center text-primary">
            <NtpcLogo className="h-7 w-7" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="animate-logo-breathe flex h-9 w-9 items-center justify-center text-primary">
              <NtpcLogo className="h-8 w-8" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground">
                NTPC Admin
              </span>
              <span className="text-[11px] text-sidebar-foreground/70">
                Operations control
              </span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {adminNav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} title={item.label}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/15"
                    : "text-sidebar-foreground hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md border border-border bg-muted/60 p-3">
          <p className="text-xs font-medium text-foreground">System Healthy</p>
          <p className="mt-1 text-xs text-muted-foreground">All services operational</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "mt-3 inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export function MobileSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {adminNav.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to} onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
