import React from "react"
import {Separator} from "@/components/ui/separator.tsx"
import {cn} from "@/lib/utils.ts";
import {PersonalSection} from "@/components/settings/personal-section.tsx";

export function FieldRow({label, children, className}: { label: string; children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function Toggle({enabled, onChange, disabled}: {
  enabled: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange?.(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? "bg-blue-500 border-blue-500" : "bg-muted border-border"
      }`}
    >
      <span
        className={`pointer-events-none block size-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}


export default function SettingsPage() {

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-10">

        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
        </div>
        <Separator/>
        <PersonalSection />
      </div>
    </div>
  )
}