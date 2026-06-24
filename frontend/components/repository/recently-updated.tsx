import { FileClock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { recentlyUpdated } from "@/lib/portal-data"

export function RecentlyUpdated() {
  return (
    <Card className="ntpc-card border-border bg-card/92">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileClock className="size-4 text-primary" aria-hidden="true" />
          Recently Updated
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ul className="flex flex-col">
          {recentlyUpdated.map((doc, i) => (
            <li key={doc.id}>
              <div className="flex flex-col gap-1 rounded-md px-3 py-2.5 transition-all duration-200 hover:translate-x-0.5 hover:bg-secondary">
                <span className="text-sm font-medium leading-snug text-foreground">
                  {doc.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {doc.category} &middot; {doc.updated}
                </span>
              </div>
              {i < recentlyUpdated.length - 1 && (
                <div className="mx-3 border-t border-border" />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
