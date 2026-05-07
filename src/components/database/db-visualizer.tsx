/**
 * DatabaseVisualizer
 *
 * Renders the live PostgreSQL schema as an interactive ER-diagram powered by
 * Cytoscape.js.  Each table becomes a node; each foreign-key becomes a
 * directed edge.  Clicking a node opens a detail panel on the right showing
 * every column (with PK / FK / Unique badges), FK relationships, indexes,
 * check constraints, and default values.
 *
 * Data is fetched from GET /api/db-schema
 */

import { useCallback, useEffect, useRef, useState } from "react"
import cytoscape from "cytoscape"
import type { Core, EventObject } from "cytoscape"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconAtom,
  IconDatabase,
  IconEye,
  IconEyeOff,
  IconHierarchy,
  IconKey,
  IconLayoutGrid,
  IconLink,
  IconLoader2,
  IconRefresh,
  IconSearch,
  IconTag,
  IconX,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"


interface Column {
  name: string
  type: string
  nullable: boolean
  default: string | null
  isPk: boolean
  isUnique: boolean
  isFk: boolean
}

interface Index {
  name: string
  definition: string
}

interface CheckConstraint {
  name: string
  clause: string
}

interface Table {
  name: string
  rowCount: number
  columns: Column[]
  indexes: Index[]
  checks: CheckConstraint[]
}

interface ForeignKey {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  onDelete: string
  onUpdate: string
  constraintName: string
}

interface SchemaData {
  tables: Table[]
  foreignKeys: ForeignKey[]
}

type LayoutName = "cose" | "breadth-first" | "grid"

// Tables are color-coded by domain group so relationships are visually obvious
// even before clicking.
//
// auth    – better-auth core tables
// chat    – AI conversation tables
// profile – per-user settings / hidden data
// search  – web search cache + vector embeddings

const GROUPS = {
  auth:    { label: "Auth",    bg: "#0f2744", border: "#3b82f6" },
  chat:    { label: "Chat",    bg: "#1e0e4a", border: "#8b5cf6" },
  profile: { label: "Profile", bg: "#052e20", border: "#10b981" },
  search:  { label: "Search",  bg: "#2d0f04", border: "#f97316" },
  other:   { label: "Other",   bg: "#141e2d", border: "#475569" },
} as const

type GroupKey = keyof typeof GROUPS

function getGroup(tableName: string): GroupKey {
  if (["user", "session", "account", "verification"].includes(tableName)) return "auth"
  if (["conversation", "message", "message_file"].includes(tableName)) return "chat"
  if (["user_preferences", "hidden_data", "health_profile"].includes(tableName)) return "profile"
  if (["web_search"].includes(tableName)) return "search"
  return "other"
}

// Cytoscape element builders
function buildElements(schema: SchemaData): cytoscape.ElementDefinition[] {
  const nodes: cytoscape.ElementDefinition[] = schema.tables.map(t => {
    const group = getGroup(t.name)
    return {
      data: {
        id:          t.name,
        // Multi-line label: table name + quick stats
        label:       `${t.name}\n${t.columns.length} cols · ${t.rowCount.toLocaleString()} rows`,
        group,
        bgColor:     GROUPS[group].bg,
        borderColor: GROUPS[group].border,
        columnCount: t.columns.length,
        rowCount:    t.rowCount,
      },
    }
  })

  const edges: cytoscape.ElementDefinition[] = schema.foreignKeys.map((fk, i) => ({
    data: {
      id:         `fk-${i}`,
      source:     fk.fromTable,
      target:     fk.toTable,
      // Short label shown on the edge when edge-labels are toggled on
      label:      `${fk.fromColumn} → ${fk.toColumn}`,
      onDelete:   fk.onDelete,
      fromColumn: fk.fromColumn,
      toColumn:   fk.toColumn,
    },
  }))

  return [...nodes, ...edges]
}

// Cytoscape stylesheet builder
function buildStyles(showEdgeLabels: boolean) {
  return [
    // Base node
    {
      selector: "node",
      style: {
        "background-color": "data(bgColor)",
        "border-color":     "data(borderColor)",
        "border-width":     1.5,
        label:              "data(label)",
        color:              "#e2e8f0",
        "font-size":        "10.5px",
        "font-weight":      "600",
        "font-family":      "Inter, system-ui, sans-serif",
        "text-valign":      "center",
        "text-halign":      "center",
        "text-wrap":        "wrap",
        "text-max-width":   "165px",
        width:              180,
        height:             60,
        shape:              "round-rectangle",
        "transition-property": "border-width, opacity",
        "transition-duration": "120ms",
      } as any,
    },

    // Hovered / selected node
    {
      selector: "node:selected",
      style: {
        "border-width": 2.5,
        "border-color": "#fbbf24",
      } as any,
    },

    // Highlighted (programmatic, used when clicking a node)
    {
      selector: "node.highlighted",
      style: {
        "border-width": 2.5,
        "border-color": "#fbbf24",
        "z-index":      10,
      } as any,
    },

    // Dimmed (non-highlighted neighbors)
    {
      selector: "node.dimmed",
      style: { opacity: 0.2 },
    },
    {
      selector: "node.group-dimmed",
      style: { opacity: 0.15 },
    },

    // Base edge
    {
      selector: "edge",
      style: {
        width:                    1.5,
        "line-color":             "#1e3a5f",
        "target-arrow-color":     "#3b82f6",
        "target-arrow-shape":     "triangle",
        "source-arrow-shape":     "none",
        "curve-style":            "bezier",
        // Edge label (FK column mapping)
        label:                    showEdgeLabels ? "data(label)" : "",
        "font-size":              "8px",
        color:                    "#64748b",
        "text-background-color":  "#0b1626",
        "text-background-opacity": 0.9,
        "text-background-padding": "2px",
        "text-background-shape":  "roundrectangle",
        "text-rotation":          "autorotate",
        "transition-property":    "line-color, opacity, width",
        "transition-duration":    "120ms",
      } as any,
    },

    // Highlighted edge
    {
      selector: "edge.highlighted",
      style: {
        "line-color":         "#f59e0b",
        "target-arrow-color": "#f59e0b",
        color:                "#fbbf24",
        width:                2.5,
        "z-index":            10,
      },
    },

    // Dimmed edge
    {
      selector: "edge.dimmed",
      style: { opacity: 0.08 },
    },
  ]
}

// Layout configurations

// cose          – force-directed spring embedder (best for general ER diagrams)
// breadth-first – tree layout following FK direction; good for seeing hierarchy
// grid          – uniform grid; fastest to compute, good for many-table schemas

function getLayoutConfig(name: LayoutName): cytoscape.LayoutOptions {
  switch (name) {
    case "cose":
      return {
        name:            "cose",
        padding:         60,
        fit:             true,
        randomize:       true,
        nodeRepulsion:   500000,
        idealEdgeLength: 200,
        edgeElasticity:  45,
        gravity:         60,
        numIter:         1500,
        initialTemp:     200,
        coolingFactor:   0.97,
        minTemp:         1,
      } as any

    case "breadth-first":
      return {
        name:          "breadthfirst",
        padding:       60,
        fit:           true,
        directed:      true,
        spacingFactor: 1.6,
        avoidOverlap:  true,
      } as any

    case "grid":
      return {
        name:          "grid",
        padding:       60,
        fit:           true,
        spacingFactor: 1.4,
        rows:          3,
      } as any
  }
}

// ColumnRow

// Single row in the column list.  Visual hierarchy:
//   [badges] [name]  [type badge]  [?]
//
// Primary key rows get a warm amber tint so they jump out immediately.

function ColumnRow({ col }: { col: Column }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[36px_1fr_auto_12px] items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs",
        col.isPk
          ? "bg-amber-500/10 border border-amber-500/15"
          : "hover:bg-muted/40 border border-transparent"
      )}
    >
      {/* Badge cluster */}
      <div className="flex items-center gap-0.5">
        {col.isPk && (
          <span title="Primary Key"
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            PK
          </span>
        )}
        {col.isFk && !col.isPk && (
          <span title="Foreign Key"
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            FK
          </span>
        )}
        {col.isUnique && !col.isPk && (
          <span title="Unique"
                className="text-[9px] font-bold px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
            UQ
          </span>
        )}
      </div>

      {/* Column name */}
      <span className={cn(
        "font-mono font-medium truncate",
        col.isPk    ? "text-amber-300" :
        col.isFk    ? "text-blue-300"  :
        col.isUnique? "text-violet-300": "text-foreground"
      )}>
        {col.name}
      </span>

      {/* PostgreSQL type */}
      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
        {col.type}
      </span>

      {/* Nullable marker */}
      <span className={cn("text-[10px] text-center", col.nullable ? "text-muted-foreground" : "text-transparent")}>
        ?
      </span>
    </div>
  )
}

// TableDetailPanel - side panel that slides in when a node is selected.
function TableDetailPanel({
  table,
  foreignKeys,
  onClose,
}: {
  table: Table
  foreignKeys: ForeignKey[]
  onClose: () => void
}) {
  const group  = getGroup(table.name)
  const colors = GROUPS[group]

  const outbound = foreignKeys.filter(fk => fk.fromTable === table.name)
  const inbound  = foreignKeys.filter(fk => fk.toTable   === table.name)
  const defaults = table.columns.filter(c => c.default !== null)

  return (
    <div className="w-72 flex flex-col border-l border-border/50 bg-card shrink-0">

      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b border-border/50"
        style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, transparent 100%)` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors.border }} />
          <span className="font-semibold text-sm font-mono truncate">{table.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
            {table.rowCount.toLocaleString()} rows
          </span>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-6 w-6">
            <IconX size={12} />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-5 pb-20">

        {/* Columns */}
        <section>
          <SectionLabel>Columns ({table.columns.length})</SectionLabel>
          {/* Column table header */}
          <div className="grid grid-cols-[36px_1fr_auto_12px] items-center gap-1.5 px-2 mb-1 text-[10px] text-muted-foreground">
            <span>Flag</span>
            <span>Name</span>
            <span>Type</span>
            <span className="text-center" title="Nullable">?</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {table.columns.map(col => <ColumnRow key={col.name} col={col} />)}
          </div>
        </section>

        {/* Outbound FK relationships */}
        {outbound.length > 0 && (
          <section>
            <SectionLabel>References</SectionLabel>
            <div className="flex flex-col gap-1">
              {outbound.map((fk, i) => (
                <div key={i}
                     className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs">
                  <span className="font-mono text-blue-300 truncate min-w-0">{fk.fromColumn}</span>
                  <IconArrowRight size={10} className="text-muted-foreground shrink-0" />
                  <span className="font-mono text-muted-foreground truncate min-w-0 flex-1">
                    {fk.toTable}<span className="text-muted-foreground/50">.</span>{fk.toColumn}
                  </span>
                  {fk.onDelete !== "NO ACTION" && (
                    <span className="shrink-0 text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 ml-auto">
                      {fk.onDelete}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Inbound FK relationships */}
        {inbound.length > 0 && (
          <section>
            <SectionLabel>Referenced by</SectionLabel>
            <div className="flex flex-col gap-1">
              {inbound.map((fk, i) => (
                <div key={i}
                     className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-xs">
                  <span className="font-mono text-violet-300 truncate min-w-0">
                    {fk.fromTable}<span className="text-muted-foreground/50">.</span>{fk.fromColumn}
                  </span>
                  <IconArrowRight size={10} className="text-muted-foreground shrink-0" />
                  <span className="font-mono text-muted-foreground truncate min-w-0 flex-1">
                    {fk.toColumn}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Indexes */}
        {table.indexes.length > 0 && (
          <section>
            <SectionLabel>Indexes ({table.indexes.length})</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {table.indexes.map((idx, i) => (
                <div key={i}
                     className="px-2 py-2 rounded-lg bg-muted/20 border border-border/30">
                  <p className="text-xs font-medium font-mono text-foreground truncate">{idx.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5 break-all leading-relaxed">
                    {idx.definition}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Check constraints */}
        {table.checks.length > 0 && (
          <section>
            <SectionLabel>Check constraints</SectionLabel>
            <div className="flex flex-col gap-1.5">
              {table.checks.map((chk, i) => (
                <div key={i}
                     className="px-2 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <p className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
                    {chk.clause}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Defaults */}
        {defaults.length > 0 && (
          <section>
            <SectionLabel>Default values</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {defaults.map(col => (
                <div key={col.name}
                     className="flex items-start gap-2 px-2 py-1 text-[10px] font-mono">
                  <span className="text-muted-foreground shrink-0">{col.name}:</span>
                  <span className="text-emerald-400 break-all">{col.default}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

// Small helper for section titles in the detail panel
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
      {children}
    </p>
  )
}

// ---- Main export ----
export function DatabaseVisualizer({ graphHeight = 580, className }: { graphHeight?: number | string; className?: string }) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const cyRef         = useRef<Core | null>(null)
  const layoutRef     = useRef<cytoscape.Layouts | null>(null)

  const [schema,        setSchema]        = useState<SchemaData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [search,        setSearch]        = useState("")
  const [layoutName,    setLayoutName]    = useState<LayoutName>("cose")
  const [showLabels,    setShowLabels]    = useState(false)
  const [activeGroup,   setActiveGroup]   = useState<GroupKey | null>(null) // activeGroup – when set, dims all nodes outside that group (legend filter)

  const fetchSchema = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/db-schema`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        return res.json() as Promise<SchemaData>
      })
      .then(data => { setSchema(data); setLoading(false) })
      .catch(err => { setError(String(err.message ?? err)); setLoading(false) })
  }, [])

  useEffect(() => { fetchSchema() }, [fetchSchema])

  useEffect(() => { // cytoscape initialization
    if (!schema || !containerRef.current) return

    // Create a fresh DOM node for each cy instance. On cleanup we remove it from
    // the DOM entirely — this is the only reliable way to stop Cytoscape's native
    // DOM event listeners (mousemove/mousedown/mouseup) from firing on a destroyed
    // instance, which happens because React Strict Mode runs cleanup then re-runs
    // the effect, leaving stale listeners on a reused container element.
    const mountNode = document.createElement("div")
    mountNode.style.width  = "100%"
    mountNode.style.height = "100%"
    containerRef.current.appendChild(mountNode)

    const cy = cytoscape({
      container: mountNode,
      elements:  buildElements(schema),
      style:     buildStyles(showLabels),
      minZoom:   0.15,
      maxZoom:   4,
    })

    // Run layout separately so we hold a reference — needed to call layout.stop()
    // before cy.destroy() in cleanup. CoseLayout runs across many requestAnimationFrame
    // callbacks; if we destroy cy while the layout is mid-animation the queued rAF
    // fires and tries to call endBatch() on a null _private.
    const layout = cy.layout(getLayoutConfig(layoutName))
    layoutRef.current = layout
    layout.run()

    // Node tap → highlight neighborhood + open detail panel
    cy.on("tap", "node", (evt: EventObject) => {
      const id    = evt.target.id() as string
      const table = schema.tables.find(t => t.name === id) ?? null
      setSelectedTable(table)

      cy.elements().removeClass("highlighted dimmed")
      const node = evt.target
      node.addClass("highlighted")
      node.connectedEdges().addClass("highlighted")
      node.connectedEdges().connectedNodes().addClass("highlighted")
      cy.elements().not(".highlighted").addClass("dimmed")
    })

    // Background tap → deselect
    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        setSelectedTable(null)
        cy.elements().removeClass("highlighted dimmed")
      }
    })

    cyRef.current = cy

    return () => {
      cyRef.current = null
      layoutRef.current?.stop()
      layoutRef.current = null
      // Stub out startBatch/endBatch BEFORE destroying. CoseLayout schedules
      // requestAnimationFrame callbacks that may fire after destroy() nulls
      // _private; those callbacks call endBatch() which then crashes. The stubs
      // stay on the instance so any queued rAF callbacks hit them instead.
      ;(cy as any).startBatch = () => {}
      ;(cy as any).endBatch   = () => {}
      ;(cy as any).fit        = () => {}
      cy.destroy()
      mountNode.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema])

  // Edge labels
  useEffect(() => {
    cyRef.current?.style(buildStyles(showLabels))
  }, [showLabels])

  // Search filter
  //    Dims any node whose name doesn't contain the search string.
  //    Edges are also dimmed when a search is active so the graph stays readable.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    if (!search.trim()) {
      cy.elements().removeClass("dimmed")
      return
    }
    const q = search.toLowerCase()
    cy.nodes().forEach(n => {
      if (n.id().toLowerCase().includes(q)) n.removeClass("dimmed")
      else n.addClass("dimmed")
    })
    cy.edges().addClass("dimmed")
  }, [search])

  // Legend group filter
  //     Clicking a legend badge dims every table outside that domain group.
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    if (!activeGroup) {
      cy.elements().removeClass("group-dimmed")
      return
    }
    cy.nodes().forEach(n => {
      if (n.data("group") === activeGroup) n.removeClass("group-dimmed")
      else n.addClass("group-dimmed")
    })
    cy.edges().addClass("group-dimmed")
  }, [activeGroup])



  const runLayout = (name: LayoutName) => {
    setLayoutName(name)
    cyRef.current?.layout(getLayoutConfig(name)).run()
  }

  const fitGraph = () => cyRef.current?.fit(undefined, 30)

  const zoom = (factor: number) => {
    const cy = cyRef.current
    if (!cy) return
    cy.zoom({
      level:            cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    })
  }


  // Loading / error states
  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-10 flex items-center justify-center gap-3 text-muted-foreground">
        <IconLoader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading database schema…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-10 flex flex-col items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20">
          <IconAlertTriangle size={24} className="text-amber-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Failed to load schema</p>
          <p className="text-xs text-muted-foreground font-mono">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSchema}>
          <IconRefresh size={13} /> Retry
        </Button>
      </div>
    )
  }

  if (!schema) return null
  const totalRows = schema.tables.reduce((s, t) => s + t.rowCount, 0)

  // Render
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card overflow-hidden", className)}>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/10">

        {/* Title + counts */}
        <div className="flex items-center gap-2 mr-auto min-w-0">
          <IconDatabase size={15} className="text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold">Database Schema</h2>
          <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
            {schema.tables.length} tables · {schema.foreignKeys.length} FK{schema.foreignKeys.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter tables…"
            className="pl-7 h-7 w-36 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={10} />
            </button>
          )}
        </div>

        {/* Layout selector */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/60 border border-border/50">
          {(
            [
              ["cose",        "Force",  IconAtom       ],
              ["breadth-first","Tree",   IconHierarchy  ],
              ["grid",        "Grid",   IconLayoutGrid ],
            ] as const
          ).map(([name, label, Icon]) => (
            <button
              key={name}
              onClick={() => runLayout(name)}
              title={`${label} layout`}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                layoutName === name
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={12} />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Zoom + misc controls */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={() => zoom(1.25)} title="Zoom in">
            <IconZoomIn size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => zoom(0.8)} title="Zoom out">
            <IconZoomOut size={14} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={fitGraph} title="Fit to screen">
            <IconZoomReset size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowLabels(v => !v)}
            title={showLabels ? "Hide FK labels" : "Show FK labels"}
            className={showLabels ? "text-foreground" : "text-muted-foreground"}
          >
            {showLabels ? <IconEye size={14} /> : <IconEyeOff size={14} />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={fetchSchema} title="Refresh schema">
            <IconRefresh size={14} />
          </Button>
        </div>
      </div>

      <div className="flex" style={{ height: graphHeight }}>

        {/* Cytoscape container */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse at 40% 40%, oklch(0.18 0.025 264 / 1) 0%, oklch(0.11 0.012 264 / 1) 100%)",
          }}
        >
          {/* The Cytoscape canvas mounts here */}
          <div ref={containerRef} className="w-full h-full" />

          {/* Click-hint overlay — disappears once a node is selected */}
          {!selectedTable && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full text-[10px] text-muted-foreground bg-black/40 border border-white/5 backdrop-blur-sm">
                Click a table to inspect · Scroll to zoom · Drag to pan
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {(Object.entries(GROUPS) as [GroupKey, (typeof GROUPS)[GroupKey]][])
              .filter(([k]) => k !== "other")
              .map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => setActiveGroup(prev => prev === key ? null : key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all",
                    activeGroup === key
                      ? "bg-white/10 border-white/25 text-white"
                      : "bg-black/35 border-white/8 text-muted-foreground hover:text-foreground hover:border-white/15 backdrop-blur-sm"
                  )}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.border }} />
                  {g.label}
                </button>
              ))
            }
            {activeGroup && (
              <button
                onClick={() => setActiveGroup(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border bg-black/35 border-white/8 text-muted-foreground hover:text-foreground backdrop-blur-sm"
              >
                <IconX size={9} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Detail panel — shown only when a node is selected */}
        {selectedTable && (
          <TableDetailPanel
            table={selectedTable}
            foreignKeys={schema.foreignKeys}
            onClose={() => {
              setSelectedTable(null)
              cyRef.current?.elements().removeClass("highlighted dimmed")
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-t border-border/50 bg-muted/10">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PK</span>
          Primary Key
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">FK</span>
          Foreign Key
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">UQ</span>
          Unique
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconKey   size={11} className="text-amber-400" />
          <IconLink  size={11} className="text-blue-400"  />
          <IconTag   size={11} className="text-violet-400"/>
          <span className="ml-0.5">· click legend to filter by group</span>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {totalRows.toLocaleString()} total rows across {schema.tables.length} tables
        </div>
      </div>
    </div>
  )
}
