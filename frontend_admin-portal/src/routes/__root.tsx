import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useState } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/app-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/hooks/use-theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Admin Portal" },
      {
        name: "description",
        content:
          "AI-powered knowledge management and query resolution for the enterprise.",
      },
      { property: "og:title", content: "Admin Portal" },
      { name: "twitter:title", content: "Admin Portal" },
      { name: "description", content: "IntelliDesk Hub is an AI-powered portal for knowledge management and support ticket creation." },
      { property: "og:description", content: "IntelliDesk Hub is an AI-powered portal for knowledge management and support ticket creation." },
      { name: "twitter:description", content: "IntelliDesk Hub is an AI-powered portal for knowledge management and support ticket creation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7492d5de-e7ea-4a2c-8c57-862d52ced689/id-preview-259b8673--1717ca32-5f13-4b5f-a7e2-20adf100b22e.lovable.app-1782143455158.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7492d5de-e7ea-4a2c-8c57-862d52ced689/id-preview-259b8673--1717ca32-5f13-4b5f-a7e2-20adf100b22e.lovable.app-1782143455158.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <RootComponentInner />
    </ThemeProvider>
  );
}

function RootComponentInner() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const [adminName, setAdminName] = useState("NTPC Administrator");

  useEffect(() => {
    const storedName = localStorage.getItem("admin_name");
    if (storedName) {
      setAdminName(storedName);
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setAdminName(localStorage.getItem("admin_name") || "NTPC Administrator");
    };
    window.addEventListener("admin-profile-update", handleUpdate);
    return () => {
      window.removeEventListener("admin-profile-update", handleUpdate);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="ntpc-shell-bg flex min-h-screen w-full bg-background"
        style={{ paddingLeft: collapsed ? "72px" : "248px" }}
      >
        <div aria-hidden="true" className="thermal-backdrop">
          <div className="thermal-stack thermal-stack-secondary" />
          <div className="thermal-stack" />
          <div className="turbine-orbit" />
          <div className="heat-lines" />
        </div>
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar adminName={adminName} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </QueryClientProvider>
  );
}
