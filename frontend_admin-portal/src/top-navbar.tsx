import { Bell, Search, Menu, ChevronRight, User, Settings, LogOut } from "lucide-react";
import { useRouterState, Link } from "@tanstack/react-router";
import { useState } from "react";
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

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/tickets": "Ticket Management",
  "/knowledge": "Knowledge Base",
  "/analytics": "Analytics",
  "/settings": "System Settings",
};

const notifications = [
  { id: 1, title: "New ticket escalated", desc: "TKT-2049 marked as high priority", time: "5m ago" },
  { id: 2, title: "Knowledge base synced", desc: "428 documents reprocessed", time: "1h ago" },
  { id: 3, title: "Confidence threshold alert", desc: "Average score dropped below 0.7", time: "3h ago" },
];

export function TopNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = titleMap[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-3 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-left text-sm">Nexus Admin Portal</SheetTitle>
          </SheetHeader>
          <MobileSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link to="/" className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          N
        </div>
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">Nexus Knowledge</span>
          <span className="text-[11px] text-muted-foreground">Admin Portal</span>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground ml-2 pl-3 border-l border-border">
        <span>Admin</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{current}</span>
      </div>

      <div className="hidden lg:flex flex-1 max-w-md mx-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tickets, documents, users..."
          className="w-full h-9 pl-9 pr-3 text-sm bg-muted/60 border border-transparent rounded-md focus:bg-background focus:border-input focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">{notifications.length} unread</p>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted transition-colors">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                AS
              </div>
              <div className="hidden sm:flex flex-col leading-tight text-left">
                <span className="text-xs font-medium text-foreground">Alex Smith</span>
                <span className="text-[11px] text-muted-foreground">Administrator</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="h-4 w-4 mr-2" />Profile</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="h-4 w-4 mr-2" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { adminNav };
