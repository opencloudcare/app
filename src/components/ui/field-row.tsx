import {cn} from "@/lib/utils.ts";

export function FieldRow({label, children, className}: { label: string; children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
