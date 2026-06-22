"use client"

import { useState } from "react"
import { Bookmark, ExternalLink, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import type { Document, DocStatus } from "@/lib/portal-data"

const STATUS_DOT: Record<DocStatus, string> = {
  Published: "bg-emerald-500",
  "Under Review": "bg-amber-500",
  Draft: "bg-slate-400",
}

function StatusBadge({ status }: { status: DocStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-medium">
      <span
        className={cn("size-1.5 rounded-full", STATUS_DOT[status])}
        aria-hidden="true"
      />
      {status}
    </Badge>
  )
}

export function DocumentTable({ documents }: { documents: Document[] }) {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (documents.length === 0) {
    return (
      <Empty className="rounded-lg border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>No documents found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or category filter.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/50 hover:bg-secondary/50">
            <TableHead className="w-[40%] px-4">Document Name</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="hidden whitespace-nowrap sm:table-cell">
              Last Updated
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="px-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => {
            const bookmarked = bookmarks.has(doc.id)
            return (
              <TableRow key={doc.id}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <FileText
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="whitespace-normal text-sm font-medium text-foreground">
                        {doc.name}
                      </span>
                      <span className="text-xs text-muted-foreground lg:hidden">
                        {doc.category}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {doc.id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {doc.category}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground sm:table-cell">
                  {doc.updated}
                </TableCell>
                <TableCell>
                  <StatusBadge status={doc.status} />
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              bookmarked ? "Remove bookmark" : "Bookmark document"
                            }
                            aria-pressed={bookmarked}
                            onClick={() => toggleBookmark(doc.id)}
                          >
                            <Bookmark
                              className={cn(
                                bookmarked && "fill-primary text-primary"
                              )}
                            />
                          </Button>
                        }
                      />
                      <TooltipContent>
                        {bookmarked ? "Bookmarked" : "Bookmark"}
                      </TooltipContent>
                    </Tooltip>
                    <Button variant="outline" size="sm">
                      <ExternalLink data-icon="inline-start" />
                      <span className="hidden sm:inline">Open</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
