import React from "react";

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description: string
  soon?: boolean
}

export function SectionHeader({icon, title, description, soon,}: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {soon && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 leading-none">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}
