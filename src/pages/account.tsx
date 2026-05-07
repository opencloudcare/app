import { useEffect, useState } from "react"
import { IconActivity, IconCheck, IconLoader2, IconRuler, IconUser } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Types
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

//Helpers
const SEX_OPTIONS = [
  { value: "male",              label: "Male" },
  { value: "female",            label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
]

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border/50 shrink-0 mt-0.5">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </label>
  )
}

export function AccountPage() {
  const [form, setForm] = useState<HealthProfile>({
    date_of_birth: "",
    sex:           "",
    weight_kg:     "",
    height_cm:     "",
    blood_type:    "",
    conditions:    "",
    medications:   "",
    allergies:     "",
  })
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/health-profile`, { credentials: "include" })
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setForm({
            date_of_birth: data.date_of_birth ? data.date_of_birth.split("T")[0] : "",
            sex:           data.sex           ?? "",
            weight_kg:     data.weight_kg     != null ? String(data.weight_kg) : "",
            height_cm:     data.height_cm     != null ? String(data.height_cm) : "",
            blood_type:    data.blood_type    ?? "",
            conditions:    data.conditions    ?? "",
            medications:   data.medications   ?? "",
            allergies:     data.allergies     ?? "",
          })
        }
      })
      .finally(() => setFetching(false))
  }, [])

  function set(field: keyof HealthProfile, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/health-profile`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({
          date_of_birth: form.date_of_birth || null,
          sex:           form.sex           || null,
          weight_kg:     form.weight_kg     ? parseFloat(form.weight_kg)  : null,
          height_cm:     form.height_cm     ? parseFloat(form.height_cm)  : null,
          blood_type:    form.blood_type    || null,
          conditions:    form.conditions,
          medications:   form.medications,
          allergies:     form.allergies,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (fetching) {
    return (
      <div className="h-full flex items-center justify-center">
        <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-10">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-10">

        <div>
          <h1 className="text-lg font-semibold tracking-tight">Health Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Keep your health information up to date for more accurate AI consultations.
          </p>
        </div>

        <Separator />

        {/* Personal */}
        <section className="space-y-5">
          <SectionHeader
            icon={IconUser}
            title="Personal"
            description="Basic biological information used to personalise your health assessments."
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
              <Input
                id="dob"
                type="date"
                value={form.date_of_birth ?? ""}
                onChange={e => set("date_of_birth", e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel>Sex</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {SEX_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("sex", form.sex === opt.value ? "" : opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer",
                      form.sex === opt.value
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Body metrics */}
        <section className="space-y-5">
          <SectionHeader
            icon={IconRuler}
            title="Body metrics"
            description="Weight, height, and blood type help calculate risk factors and BMI."
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="weight">Weight</FieldLabel>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  placeholder="70.0"
                  value={form.weight_kg ?? ""}
                  onChange={e => set("weight_kg", e.target.value)}
                  className="pr-8 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="height">Height</FieldLabel>
              <div className="relative">
                <Input
                  id="height"
                  type="number"
                  min="50"
                  max="300"
                  step="0.1"
                  placeholder="175"
                  value={form.height_cm ?? ""}
                  onChange={e => set("height_cm", e.target.value)}
                  className="pr-8 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">cm</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Blood type</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_TYPES.map(bt => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => set("blood_type", form.blood_type === bt ? "" : bt)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border font-mono transition-all cursor-pointer",
                    form.blood_type === bt
                      ? "bg-red-500/15 border-red-500/40 text-red-300"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        {/* Medical history */}
        <section className="space-y-5">
          <SectionHeader
            icon={IconActivity}
            title="Medical history"
            description="Conditions, medications, and allergies shared with the AI during consultations."
          />

          <div className="space-y-1.5">
            <FieldLabel htmlFor="conditions">Known conditions</FieldLabel>
            <textarea
              id="conditions"
              rows={3}
              placeholder="e.g. Type 2 diabetes, hypertension, asthma…"
              value={form.conditions}
              onChange={e => set("conditions", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="medications">Current medications</FieldLabel>
            <textarea
              id="medications"
              rows={3}
              placeholder="e.g. Metformin 500mg twice daily, Lisinopril 10mg…"
              value={form.medications}
              onChange={e => set("medications", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
            <textarea
              id="allergies"
              rows={2}
              placeholder="e.g. Penicillin, peanuts, latex…"
              value={form.allergies}
              onChange={e => set("allergies", e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </section>

        <Separator />

        {/* Save */}
        <div className="flex items-center justify-between pb-4">
          {error && <p className="text-xs text-destructive">{error}</p>}
          {!error && saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <IconCheck size={12} /> Saved
            </span>
          )}
          {!error && !saved && <span />}

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <IconLoader2 size={13} className="animate-spin" /> : null}
            Save changes
          </Button>
        </div>

      </div>
    </div>
  )
}
