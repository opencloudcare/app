import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import {
  IconActivity,
  IconArrowRight,
  IconCalendar,
  IconHeartbeat,
  IconLoader2,
  IconMessageCircle,
  IconMicroscope,
  IconPill,
  IconStethoscope,
  IconUpload,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/auth"

// Types

interface Stats {
  conversationCount: number
  messageCount: number
  memberSince: string | null
}

interface Conversation {
  id: string
  title: string
  updated_at: string
}

interface HealthProfile {
  date_of_birth: string | null
  sex: string | null
  weight_kg: string | null
  height_cm: string | null
  blood_type: string | null
  conditions: string
  medications: string
  allergies: string
}

// ---- Helpers -----
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function bmi(weight: string | null, height: string | null): string | null {
  const w = parseFloat(weight ?? "")
  const h = parseFloat(height ?? "") / 100
  if (!w || !h) return null
  return (w / (h * h)).toFixed(1)
}

function profileCompleteness(p: HealthProfile | null): number {
  if (!p) return 0
  const fields = [p.date_of_birth, p.sex, p.weight_kg, p.height_cm, p.blood_type, p.conditions, p.medications, p.allergies]
  return Math.round(fields.filter(f => f && String(f).trim() !== "").length / fields.length * 100)
}

function memberDuration(iso: string | null): string {
  if (!iso) return "—"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1)  return "Today"
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  return `${Math.floor(days / 365)}yr`
}

// Sub-components
function StatCard({ label, value, sub, accent }: {
  label: string
  value: React.ReactNode
  sub?: string
  accent?: "blue" | "violet" | "emerald" | "amber"
}) {
  const ring = {
    blue:    "from-blue-500/10 border-blue-500/20",
    violet:  "from-violet-500/10 border-violet-500/20",
    emerald: "from-emerald-500/10 border-emerald-500/20",
    amber:   "from-amber-500/10 border-amber-500/20",
  }[accent ?? "blue"]

  const text = {
    blue:    "text-blue-300",
    violet:  "text-violet-300",
    emerald: "text-emerald-300",
    amber:   "text-amber-300",
  }[accent ?? "blue"]

  return (
    <div className={cn(
      "rounded-2xl border bg-linear-to-br to-transparent p-4 space-y-1",
      ring
    )}>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn("text-2xl font-semibold tracking-tight", text)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function QuickAction({ icon: Icon, label, description, onClick, accent }: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  accent: "blue" | "violet" | "emerald"
}) {
  const styles = {
    blue:    { bg: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20", icon: "text-blue-400" },
    violet:  { bg: "bg-violet-500/10 hover:bg-violet-500/15 border-violet-500/20", icon: "text-violet-400" },
    emerald: { bg: "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20", icon: "text-emerald-400" },
  }[accent]

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left w-full cursor-pointer",
        styles.bg
      )}
    >
      <Icon size={18} className={styles.icon} />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  )
}

function openWindow(name: "chat" | "fileEx") {
  window.dispatchEvent(new CustomEvent("opencare:openWindow", {detail: {window: name}}))
}

function ConversationRow({ conv }: { conv: Conversation }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 border border-transparent hover:border-border/30 transition-all group">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
        <IconMessageCircle size={12} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{conv.title || "Untitled consultation"}</p>
        <p className="text-[11px] text-muted-foreground">{relativeTime(conv.updated_at)}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          openWindow("chat")
          window.dispatchEvent(new CustomEvent("opencare:loadConversation", {detail: {id: conv.id, title: conv.title}}))
        }}
        className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        Resume <IconArrowRight size={11} className="ml-1" />
      </Button>
    </div>
  )
}

function HealthProfileCard({ profile, completeness, onEdit }: {
  profile: HealthProfile | null
  completeness: number
  onEdit: () => void
}) {
  const bmVal = profile ? bmi(profile.weight_kg, profile.height_cm) : null

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div
        className="px-4 py-3 border-b border-border/50 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #052e20 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-2">
          <IconHeartbeat size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold">Health Profile</span>
        </div>
        <button
          onClick={onEdit}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Edit →
        </button>
      </div>

      {/* Completeness bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</span>
          <span className={cn("text-[11px] font-medium", completeness === 100 ? "text-emerald-400" : "text-amber-400")}>
            {completeness}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", completeness === 100 ? "bg-emerald-500" : "bg-amber-500")}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!profile || completeness === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <IconAlertTriangle size={20} className="text-amber-400" />
            <p className="text-xs text-muted-foreground">Complete your health profile for better AI responses.</p>
            <Button size="sm" variant="outline" onClick={onEdit} className="mt-1">
              Complete profile
            </Button>
          </div>
        ) : (
          <>
            {/* Body metrics row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Blood", value: profile.blood_type || "—", color: "text-red-300" },
                { label: "Weight", value: profile.weight_kg ? `${profile.weight_kg}kg` : "—", color: "text-blue-300" },
                { label: "BMI", value: bmVal ?? "—", color: "text-violet-300" },
              ].map(item => (
                <div key={item.label} className="bg-muted/30 rounded-xl p-2.5 text-center border border-border/30">
                  <p className={cn("text-sm font-semibold font-mono", item.color)}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Medical history */}
            {[
              { icon: IconActivity, label: "Conditions", value: profile.conditions, color: "text-amber-400" },
              { icon: IconPill,     label: "Medications", value: profile.medications, color: "text-blue-400" },
              { icon: IconAlertTriangle, label: "Allergies", value: profile.allergies, color: "text-red-400" },
            ].map(({ icon: Icon, label, value, color }) => value ? (
              <div key={label} className="flex items-start gap-2.5">
                <Icon size={13} className={cn("mt-0.5 shrink-0", color)} />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-xs text-foreground mt-0.5 line-clamp-2 leading-relaxed">{value}</p>
                </div>
              </div>
            ) : null)}
          </>
        )}
      </div>
    </div>
  )
}


// ------ Main function --------
export function DashboardPage() {
  const navigate = useNavigate()
  const [user,          setUser]          = useState<User | null>(null)
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(null)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL
    const get = (url: string) =>
      fetch(url, { credentials: "include" })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)

    Promise.all([
      get(`${base}/api/me`),
      get(`${base}/api/user/stats`),
      get(`${base}/api/ai/conversations`),
      get(`${base}/api/user/health-profile`),
    ]).then(([userData, statsData, convsData, profileData]) => {
      setUser(userData?.user ?? null)
      setStats(statsData)
      setConversations(convsData?.data ?? [])
      setHealthProfile(profileData?.data ?? null)
      setLoading(false)
    })
  }, [])

  const completeness = profileCompleteness(healthProfile)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Welcome hero */}
        <div className="relative rounded-2xl overflow-hidden p-6 border border-border/50 bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-violet-500/10">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 80% 20%, oklch(0.65 0.18 264 / 0.12), transparent 60%)" }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{greeting()}</p>
              <h1 className="text-2xl font-semibold tracking-tight">{user?.firstName ?? user?.name}</h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                Describe your symptoms and our AI will help you understand what might be going on.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground bg-muted/30 border border-border/30 px-3 py-1.5 rounded-xl">
              <IconCalendar size={11} />
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Consultations"
            value={stats?.conversationCount ?? "—"}
            sub="total sessions"
            accent="blue"
          />
          <StatCard
            label="Messages"
            value={stats?.messageCount ?? "—"}
            sub="questions asked"
            accent="violet"
          />
          <StatCard
            label="Member for"
            value={memberDuration(stats?.memberSince ?? null)}
            sub={stats?.memberSince ? new Date(stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
            accent="emerald"
          />
          <StatCard
            label="Profile"
            value={`${completeness}%`}
            sub={completeness < 100 ? "incomplete" : "complete"}
            accent="amber"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left column — quick actions + recent consultations */}
          <div className="lg:col-span-2 space-y-4">

            {/* Quick actions */}
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <QuickAction
                  icon={IconStethoscope}
                  label="New consultation"
                  description="Describe your symptoms to the AI"
                  onClick={() => {
                    openWindow("chat")
                    window.dispatchEvent(new CustomEvent("opencare:newConversation"))
                  }}
                  accent="blue"
                />
                <QuickAction
                  icon={IconUpload}
                  label="Upload document"
                  description="Share lab results or medical records"
                  onClick={() => openWindow("fileEx")}
                  accent="violet"
                />
                <QuickAction
                  icon={IconMicroscope}
                  label="Edit health profile"
                  description="Keep your health data current"
                  onClick={() => navigate("/account")}
                  accent="emerald"
                />
              </div>
            </div>

            {/* Recent consultations */}
            <div className="rounded-2xl border border-border/50 bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Recent consultations
                </p>
                {conversations.length > 5 && (
                  <button
                    onClick={() => {
                      openWindow("chat")
                      window.dispatchEvent(new CustomEvent("opencare:showConversationsPanel"))
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    View all →
                  </button>
                )}
              </div>

              {conversations.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <IconMessageCircle size={20} className="text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No consultations yet.</p>
                  <p className="text-xs text-muted-foreground/60">Start a new consultation to get AI-powered health insights.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {conversations.slice(0, 6).map(conv => (
                    <ConversationRow key={conv.id} conv={conv} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — health profile */}
          <div>
            <HealthProfileCard
              profile={healthProfile}
              completeness={completeness}
              onEdit={() => navigate("/account")}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
