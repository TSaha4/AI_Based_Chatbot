"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryCards } from "@/components/repository/category-cards"
import { DocumentTable } from "@/components/repository/document-table"
import { RecentlyUpdated } from "@/components/repository/recently-updated"
import { documents } from "@/lib/portal-data"

export default function RepositoryPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchesCategory = category === "All" || doc.category === category
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  const hasFilters = category !== "All" || query.trim() !== ""

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Knowledge Repository
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Search and browse documents, manuals, and policies across the
          organization.
        </p>
      </header>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, manuals, and policies…"
          aria-label="Search documents"
          className="h-11 pl-10"
        />
      </div>

      {/* Categories */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Browse by Category
        </h2>
        <CategoryCards active={category} onSelect={setCategory} />
      </section>

      {/* Table + sidebar */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Documents
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>
          </h2>
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {category !== "All" && (
                <Badge variant="secondary" className="gap-1">
                  {category}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("All")
                  setQuery("")
                }}
              >
                <X data-icon="inline-start" />
                Clear filters
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <DocumentTable documents={filtered} />
          </div>
          <aside className="xl:sticky xl:top-20 xl:self-start">
            <RecentlyUpdated />
          </aside>
        </div>
      </section>
    </div>
  )
}
