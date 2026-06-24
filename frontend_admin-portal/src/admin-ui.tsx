import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  description,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: { value: number; positive?: boolean };
  description?: string;
  delay?: number;
}) {
  const positive = trend?.positive ?? (trend ? trend.value >= 0 : true);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      className="ntpc-card rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-start justify-between">
        <div className="animate-logo-breathe flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("ntpc-card rounded-lg border border-border bg-card", className)}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "open"
      ? "bg-primary/10 text-primary"
      : s === "in progress"
      ? "bg-warning/15 text-warning-foreground"
      : s === "escalated"
      ? "bg-destructive/10 text-destructive"
      : s === "resolved" || s === "active" || s === "completed"
      ? "bg-success/10 text-success"
      : s === "draft" || s === "pending"
      ? "bg-muted text-muted-foreground"
      : "bg-muted text-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", cls)}>
      {status}
    </span>
  );
}
