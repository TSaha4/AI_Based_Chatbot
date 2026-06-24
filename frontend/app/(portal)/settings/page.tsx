"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Sun, Moon, Check, Settings2, Palette } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Load theme on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light"
    setTheme(savedTheme)
  }, [])

  // Change theme handler
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    
    const root = document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else {
      root.classList.add("light")
      root.classList.remove("dark")
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 stagger-soft">
      {/* Page Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary border border-primary/10 shadow-sm">
            <Settings2 className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your appearance preferences and chatbot settings.
            </p>
          </div>
        </div>
      </header>

      {/* Main Settings Card */}
      <Card className="ntpc-card border-border bg-card/92 shadow-md">
        <CardHeader className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <Palette className="size-4.5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold">Appearance Theme</CardTitle>
              <CardDescription className="text-xs">
                Select your preferred theme for the chatbot interface.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Light Mode Option */}
            <button
              onClick={() => handleThemeChange("light")}
              className={`group relative flex flex-col items-stretch rounded-xl border text-left overflow-hidden transition-all duration-200 cursor-pointer ${
                theme === "light"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-muted/30 hover:border-primary/45 hover:bg-muted/50"
              }`}
            >
              {/* Preview Graphic */}
              <div className="relative h-32 border-b border-border bg-[#f0f4f8] p-3 flex gap-2">
                {/* Mini Sidebar */}
                <div className="w-1/4 rounded bg-[#0b1e33] flex flex-col gap-1 p-1">
                  <div className="h-2 w-full rounded bg-sky-400/20" />
                  <div className="h-2 w-2/3 rounded bg-slate-400/20" />
                  <div className="h-2 w-4/5 rounded bg-slate-400/10" />
                </div>
                {/* Mini Main Screen */}
                <div className="flex-1 rounded bg-[#ffffff] border border-slate-200/50 flex flex-col gap-1.5 p-2 shadow-xs">
                  <div className="self-end max-w-[70%] h-3 w-1/2 rounded bg-primary/10" />
                  <div className="self-start max-w-[80%] h-3 w-2/3 rounded bg-slate-100 border border-slate-200/40" />
                  <div className="self-start max-w-[80%] h-2 w-1/3 rounded bg-slate-100/60" />
                </div>
              </div>
              
              {/* Option Details */}
              <div className="flex items-center justify-between p-4 bg-card/40 w-full">
                <div className="flex items-center gap-2.5">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${
                    theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Sun className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Light Theme</p>
                    <p className="text-xs text-muted-foreground">Crisp light interface</p>
                  </div>
                </div>
                {theme === "light" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.16 }}
                    className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-3" />
                  </motion.div>
                )}
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              onClick={() => handleThemeChange("dark")}
              className={`group relative flex flex-col items-stretch rounded-xl border text-left overflow-hidden transition-all duration-200 cursor-pointer ${
                theme === "dark"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-muted/30 hover:border-primary/45 hover:bg-muted/50"
              }`}
            >
              {/* Preview Graphic */}
              <div className="relative h-32 border-b border-border bg-[#0b1320] p-3 flex gap-2">
                {/* Mini Sidebar */}
                <div className="w-1/4 rounded bg-[#060b13] flex flex-col gap-1 p-1">
                  <div className="h-2 w-full rounded bg-sky-400/20" />
                  <div className="h-2 w-2/3 rounded bg-slate-400/20" />
                  <div className="h-2 w-4/5 rounded bg-slate-400/10" />
                </div>
                {/* Mini Main Screen */}
                <div className="flex-1 rounded bg-[#121e30] border border-slate-800/40 flex flex-col gap-1.5 p-2 shadow-xs">
                  <div className="self-end max-w-[70%] h-3 w-1/2 rounded bg-sky-500/20" />
                  <div className="self-start max-w-[80%] h-3 w-2/3 rounded bg-[#1c2b3d] border border-slate-700/30" />
                  <div className="self-start max-w-[80%] h-2 w-1/3 rounded bg-[#1c2b3d]/60" />
                </div>
              </div>

              {/* Option Details */}
              <div className="flex items-center justify-between p-4 bg-card/40 w-full">
                <div className="flex items-center gap-2.5">
                  <span className={`flex size-8 items-center justify-center rounded-lg ${
                    theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <Moon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Dark Theme</p>
                    <p className="text-xs text-muted-foreground">Calming dark interface</p>
                  </div>
                </div>
                {theme === "dark" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.16 }}
                    className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-3" />
                  </motion.div>
                )}
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
