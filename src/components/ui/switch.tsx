
function Switch({enabled, onChange, disabled}: {
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

function ToggleRow({
                            label,
                            description,
                            enabled,
                            onChange,
                            disabled,
                          }: {
  label: string
  description?: string
  enabled: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className={`text-sm font-medium ${disabled ? "text-muted-foreground" : ""}`}>{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Switch enabled={enabled} onChange={onChange} disabled={disabled}/>
    </div>
  )
}

export {Switch, ToggleRow};

