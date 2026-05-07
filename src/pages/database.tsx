import { DatabaseVisualizer } from "@/components/database/db-visualizer.tsx"

export function DatabasePage() {
  return (
    <div className="h-full flex flex-col p-4">
      <DatabaseVisualizer className="flex-1 min-h-0" graphHeight="100%" />
    </div>
  )
}
