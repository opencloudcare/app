import {ToggleRow} from "@/components/ui/switch.tsx";
import {SectionHeader} from "@/components/ui/section-header.tsx";
import {IconBrain, IconCheck, IconChevronDown, IconSparkles, IconScale, IconBolt} from "@tabler/icons-react"
import {useEffect, useState} from "react"
import {cn} from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type SupportedModels = "gemma-3-27b-it" | "gemma-4-31b-it" | "gemini-2.5-flash" | "gemini-3-flash-preview"

type ModelMeta = {
  label: string
  description: string
  tags: { label: string; variant: "speed" | "balanced" | "smart" | "preview" }[]
}

const models: Record<SupportedModels, ModelMeta> = {
  "gemma-3-27b-it": {
    label: "Gemma 3 27B",
    description: "Lightweight and fast. Great for quick questions and everyday tasks.",
    tags: [{label: "Fast", variant: "speed"}],
  },
  "gemma-4-31b-it": {
    label: "Gemma 4 31B",
    description: "A step up in reasoning while keeping response times low.",
    tags: [{label: "Balanced", variant: "balanced"}],
  },
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    description: "Strong analytical reasoning delivered at low latency.",
    tags: [{label: "Smart", variant: "smart"}, {label: "Fast", variant: "speed"}],
  },
  "gemini-3-flash-preview": {
    label: "Gemini 3 Flash",
    description: "The most capable model. Best for complex, nuanced requests.",
    tags: [{label: "Most capable", variant: "smart"}, {label: "Preview", variant: "preview"}],
  },
}

const tagStyles: Record<ModelMeta["tags"][number]["variant"], string> = {
  speed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  balanced: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  smart: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  preview: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
}

const tagIcons: Record<ModelMeta["tags"][number]["variant"], React.ReactNode> = {
  speed: <IconBolt size={10}/>,
  balanced: <IconScale size={10}/>,
  smart: <IconBrain size={10}/>,
  preview: <IconSparkles size={10}/>,
}

export const AiPreferences = () => {
  const [defaultWebSearch, setDefaultWebSearch] = useState<boolean>(false)
  const [verboseResponses, setVerboseResponses] = useState<boolean>(false)
  const [aiModel, setAiModel] = useState<SupportedModels>("gemma-3-27b-it")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/ai_preferences`, {credentials: "include"})
      .then((res) => res.json())
      .then((res) => {
        setDefaultWebSearch(res.data.enable_web_search_default)
        setVerboseResponses(res.data.detailed_responses)
        setAiModel(res.data.ai_model)
      })
  }, []);

  const savePreferences = async (updates: Partial<{
    ai_model: SupportedModels
    enable_web_search_default: boolean
    detailed_responses: boolean
  }>) => {
    const body = {
      ai_model: aiModel,
      enable_web_search_default: defaultWebSearch,
      detailed_responses: verboseResponses,
      ...updates,
    }
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/ai_preferences`, {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    })
    const response = await res.json()
    setDefaultWebSearch(response.data.enable_web_search_default)
    setVerboseResponses(response.data.detailed_responses)
    setAiModel(response.data.ai_model)
  }

  const handleModelSelect = (key: SupportedModels) => {
    setAiModel(key)
    savePreferences({ai_model: key})
    setDialogOpen(false)
  }

  return (
    <section>
      <SectionHeader
        icon={<IconBrain size={16} className="text-muted-foreground"/>}
        title="AI Preferences"
        description="Adjust how the AI assistant behaves by default."
      />
      <div className="divide-y divide-border/50">
        <ToggleRow
          label="Enable web search by default"
          description="Automatically search the web to supplement responses."
          enabled={defaultWebSearch}
          onChange={(v) => savePreferences({enable_web_search_default: v})}
        />
        <ToggleRow
          label="Verbose responses"
          description="Prefer detailed explanations over concise answers."
          enabled={verboseResponses}
          onChange={(v) => savePreferences({detailed_responses: v})}
        />

        {/* Model selector row */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Model</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose which AI model powers your assistant.</p>
            </div>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 shrink-0 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted/60">
                {models[aiModel].label}
                <IconChevronDown size={12} className="text-muted-foreground"/>
              </button>
            </DialogTrigger>
          </div>

          <DialogContent className="gap-0 p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/60 pr-10">
              <DialogTitle>Select model</DialogTitle>
              <DialogDescription>Choose which model powers your assistant.</DialogDescription>
            </DialogHeader>

            <div className="p-2">
              {(Object.entries(models) as [SupportedModels, ModelMeta][]).map(([key, meta]) => {
                const selected = aiModel === key
                return (
                  <button
                    key={key}
                    onClick={() => handleModelSelect(key)}
                    className={cn(
                      "w-full cursor-pointer text-left flex items-start gap-3 rounded-xl px-3 py-3 transition-colors",
                      selected ? "bg-blue-500/10" : "hover:bg-muted/60"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      selected ? "border-blue-500 bg-blue-500" : "border-border"
                    )}>
                      {selected && <IconCheck size={10} className="text-white" strokeWidth={3}/>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-sm font-medium", selected && "text-blue-600 dark:text-blue-400")}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {meta.tags.map((tag) => (
                            <span
                              key={tag.label}
                              className={cn(
                                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                                tagStyles[tag.variant]
                              )}
                            >
                              {tagIcons[tag.variant]}
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};