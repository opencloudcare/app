import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { IconMessage, IconMessages, IconFileText, IconArrowRight, IconStethoscope } from "@tabler/icons-react"
import type { User } from "better-auth"

type Conversation = { id: string; title: string }

export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/conversations`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setConversations(data.data ?? []))
  }, [])

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Welcome Hero */}
        <div className="relative rounded-2xl overflow-hidden p-6 border border-border/50 bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 80% 20%, oklch(0.65 0.18 264 / 0.12), transparent 60%)" }}
          />
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Welcome back</p>
            <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
              Your AI medical assistant is ready to help analyze records, review patient notes, and assist with diagnoses.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-linear-to-br from-blue-500/20 to-blue-400/5 flex items-center justify-center shrink-0">
                <IconMessages size={17} className="text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold">{conversations.length}</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-linear-to-br from-violet-500/20 to-violet-400/5 flex items-center justify-center shrink-0">
                <IconFileText size={17} className="text-violet-500" />
              </div>
              <div>
                <p className="text-xl font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Conversations */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Conversations</h2>
          {conversations.length === 0 ? (
            <Card size="sm">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <div className="size-10 rounded-xl bg-muted flex items-center justify-center mb-1">
                  <IconStethoscope size={20} className="text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs text-muted-foreground max-w-52 leading-relaxed">
                  Start a chat to analyze medical records or get diagnostic assistance.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {conversations.slice(0, 8).map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors group cursor-pointer"
                  onClick={() => {
                    localStorage.setItem("conversationId", conv.id)
                    localStorage.setItem("conversationTitle", conv.title)
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <IconMessage size={13} className="text-muted-foreground" />
                    </div>
                    <span className="text-sm truncate">{conv.title}</span>
                  </div>
                  <IconArrowRight
                    size={14}
                    className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
