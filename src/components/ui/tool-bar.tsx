import {type ReactNode, useCallback, useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils.ts";
import {ChatInterface} from "@/components/chat/chat-interface.tsx";
import {Button} from "@/components/ui/button.tsx";
import {IconBookUpload, IconLayoutRows, IconRobot} from "@tabler/icons-react";
import {FileExplorer} from "@/components/files/file-explorer.tsx";

type ChatLayoutProps = {
  children: ReactNode
  className?: string
}

type WindowOptions = "chat" | "fileEx" | "split" | "none"

const MIN_WIDTH = 280
const COLLAPSED_WIDTH = 0
const TOOLBAR_WIDTH = 36
const MIN_PANEL_HEIGHT_PX = 80

export const ToolBar = ({children, className}: ChatLayoutProps) => {
  const [windowWidth, setWindowWidth] = useState<number>(COLLAPSED_WIDTH)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  const [splitRatio, setSplitRatio] = useState(50)
  const savedWidth = useRef<number>(512)
  const isDragging = useRef<boolean>(false)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)
  const [activeWindow, setActiveWindow] = useState<WindowOptions>("none")
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lastSavedWidth = localStorage.getItem("savedWidth");
    const lastActiveWindow = localStorage.getItem("activeWindow") as WindowOptions | null;
    const lastSplitRatio = localStorage.getItem("splitRatio");

    if (lastActiveWindow) setActiveWindow(lastActiveWindow);
    if (lastSplitRatio) setSplitRatio(parseInt(lastSplitRatio) || 50);
    if (lastSavedWidth) {
      const parsed = parseInt(lastSavedWidth);
      savedWidth.current = parsed || MIN_WIDTH;
      if (lastActiveWindow && lastActiveWindow !== "none") {
        setWindowWidth(parsed);
      }
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const {window: name} = (e as CustomEvent<{window: WindowOptions}>).detail
      const width = savedWidth.current === 0 ? 512 : savedWidth.current
      setActiveWindow(name)
      setWindowWidth(name === "none" ? COLLAPSED_WIDTH : width)
      localStorage.setItem("activeWindow", name)
      if (name !== "none") localStorage.setItem("savedWidth", width.toString())
    }
    window.addEventListener("opencare:openWindow", handler)
    return () => window.removeEventListener("opencare:openWindow", handler)
  }, [])

  const handleDragStart = useCallback((e: { clientX: number; }) => {
    isDragging.current = true
    setIsDraggingState(true)
    startX.current = e.clientX
    startWidth.current = windowWidth

    const onMouseMove = (e: { clientX: number; }) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX
      const newWidth = Math.max(MIN_WIDTH, startWidth.current + delta)
      setWindowWidth(newWidth)
      localStorage.setItem("savedWidth", newWidth.toString())
    }

    const onMouseUp = () => {
      isDragging.current = false
      setIsDraggingState(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [windowWidth])

  const handleVerticalDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingVertical(true)
    const startY = e.clientY
    const panelHeight = panelRef.current?.clientHeight ?? 0
    const startRatio = splitRatio

    const onMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY
      const deltaRatio = (delta / panelHeight) * 100
      const minRatio = (MIN_PANEL_HEIGHT_PX / panelHeight) * 100
      const newRatio = Math.min(Math.max(startRatio + deltaRatio, minRatio), 100 - minRatio)
      setSplitRatio(newRatio)
      localStorage.setItem("splitRatio", Math.round(newRatio).toString())
    }

    const onMouseUp = () => {
      setIsDraggingVertical(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [splitRatio])

  const openWindow = (name: WindowOptions) => {
    if (name === activeWindow) {
      setActiveWindow("none")
      savedWidth.current = windowWidth
      setWindowWidth(COLLAPSED_WIDTH)
      localStorage.setItem("activeWindow", "none")
      localStorage.setItem("savedWidth", windowWidth.toString())
    } else {
      setActiveWindow(name)
      setWindowWidth(savedWidth.current === 0 ? 512 : savedWidth.current)
      localStorage.setItem("activeWindow", name)
      localStorage.setItem("savedWidth", savedWidth.current === 0 ? "512" : savedWidth.current.toString())
    }
  }

  const toolbarButtons = [
    {name: "chat" as WindowOptions, icon: <IconRobot size={16}/>, title: "Assistant"},
    {name: "fileEx" as WindowOptions, icon: <IconBookUpload size={16}/>, title: "Files"},
    {name: "split" as WindowOptions, icon: <IconLayoutRows size={16}/>, title: "Split view"},
  ]

  return (
    <div className={cn(
      "h-screen overflow-hidden w-full flex flex-row",
      (isDraggingState || isDraggingVertical) && "select-none"
    )}>
      {/* Main content */}
      <div className={cn(className, "flex-1 min-w-0")}>
        {children}
      </div>

      {/* Horizontal drag handle */}
      {activeWindow !== "none" && (
        <div
          onMouseDown={handleDragStart}
          className="w-1 h-full cursor-col-resize"
        />
      )}

      {/* Side panel */}
      <div
        id="chat"
        ref={panelRef}
        style={{
          width: windowWidth,
          transition: isDraggingState ? 'none' : 'width 0.2s ease'
        }}
        className={cn(
          "shrink-0 overflow-hidden relative p-2 pl-0 flex flex-col",
          (isDraggingState || isDraggingVertical) && "select-none"
        )}
      >
        {activeWindow === "split" ? (
          <>
            <div style={{height: `${splitRatio}%`}} className="overflow-hidden min-h-0">
              <FileExplorer/>
            </div>

            <div
              onMouseDown={handleVerticalDragStart}
              className="h-1 w-full shrink-0 cursor-row-resize hover:bg-border transition-colors"
            />

            <div style={{height: `${100 - splitRatio}%`}} className="overflow-hidden min-h-0">
              <ChatInterface/>
            </div>
          </>
        ) : (
          <>
            <div className="h-full" style={{display: activeWindow === "chat" ? undefined : "none"}}>
              <ChatInterface/>
            </div>
            <div className="h-full" style={{display: activeWindow === "fileEx" ? undefined : "none"}}>
              <FileExplorer/>
            </div>
          </>
        )}
      </div>

      {/* Sidebar toolbar */}
      <div
        className="flex flex-col justify-start gap-1 items-center py-3 bg-sidebar border-l border-border/50 p-1"
        style={{width: TOOLBAR_WIDTH}}
      >
        {toolbarButtons.map((btn) => (
          <Button
            size="icon"
            key={btn.name}
            onClick={() => openWindow(btn.name)}
            variant="ghost"
            title={btn.title}
            className={cn(
              "size-8 transition-colors duration-300 ease-in-out",
              activeWindow === btn.name && "bg-muted",
            )}
          >
            {btn.icon}
          </Button>
        ))}
      </div>
    </div>
  );
};