import { useEffect, useState } from "react"
import type { User } from "better-auth"
import {FileExplorer} from "@/components/files/file-explorer.tsx";


export function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))
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

        <FileExplorer />

      </div>
    </div>
  )
}
