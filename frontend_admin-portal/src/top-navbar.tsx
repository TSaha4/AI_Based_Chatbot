import { Bell, Search, Menu, ChevronRight, User, Settings } from "lucide-react";
import { useRouterState, Link } from "@tanstack/react-router";
import { NtpcLogo } from "./components/ntpc-logo";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MobileSidebar, adminNav } from "./app-sidebar";
import { fetchPendingTickets, BackendApiError, type TicketRecord } from "@/lib/backend-api";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/tickets": "Ticket Management",
  "/knowledge": "Knowledge Base",
  "/profile": "Admin Profile",
  "/settings": "System Settings",
};

export function TopNavbar({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<TicketRecord[]>([]);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = titleMap[pathname] ?? "Admin";

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchPendingTickets(5)
        .then((records) => {
          if (active) {
            setNotifications(records);
            setNotifyError(null);
          }
        })
        .catch((err) => {
          if (active) {
            setNotifications([]);
            setNotifyError(
              err instanceof BackendApiError
                ? err.message
                : "Backend unavailable",
            );
          }
        });
    };
    load();
    const id = window.setInterval(load, 10000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load();
    });
    return () => {
      active = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-3 shadow-[0_8px_28px_rgb(8_125_182/6%)] backdrop-blur supports-[backdrop-filter]:bg-card/78 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-left text-sm">NTPC Admin Portal</SheetTitle>
          </SheetHeader>
          <MobileSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link to="/" className="flex items-center gap-2.5">
        <div className="animate-logo-breathe flex h-9 w-9 items-center justify-center text-primary">
          <NtpcLogo className="h-8 w-8" />
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">NTPC Control Center</span>
          <span className="text-[11px] text-muted-foreground">Admin portal</span>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground ml-2 pl-3 border-l border-border">
        <span>Admin</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{current}</span>
      </div>

      <div className="relative mx-4 hidden flex-1 max-w-md lg:flex">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tickets, documents, users..."
          className="h-9 w-full rounded-md border border-transparent bg-muted/60 pl-9 pr-3 text-sm transition-shadow duration-200 focus:border-input focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {notifyError ?? `${notifications.length} pending ticket${notifications.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifyError && (
                <div className="px-4 py-6 text-sm text-destructive">{notifyError}</div>
              )}
              {!notifyError && notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-muted-foreground">No pending tickets.</div>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.ticket_id}
                  to="/tickets"
                  className="block px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <p className="text-sm font-medium">Pending ticket {n.ticket_id}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.question}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-muted">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                AS
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-xs font-medium text-foreground">{adminName}</span>
                <span className="text-[11px] text-muted-foreground">Administrator</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="h-4 w-4 mr-2" />Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { adminNav };
