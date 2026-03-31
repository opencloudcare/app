import React, {type ReactNode, useCallback, useRef, useState} from "react";
import {cn} from "@/lib/utils.ts";
import {ChatInterface} from "@/components/chat/chat-interface.tsx";
import {Button} from "@/components/ui/button.tsx";
import {IconBookUpload, IconRobot} from "@tabler/icons-react";
import {FileExplorer} from "@/components/files/file-explorer.tsx";

type ChatLayoutProps = {
  children: ReactNode
  className?: string
}

type WindowOptions = "chat" | "fileEx" | "none"

const MIN_WIDTH = 280
const COLLAPSED_WIDTH = 0
const TOOLBAR_WIDTH = 36

export const ToolBar = ({children, className}: ChatLayoutProps) => {
  // initialize the variables
  const [windowWidth, setChatWidth] = useState<number>(512)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const savedWidth = useRef<number>(512)
  const isDragging = useRef<boolean>(false)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)
  const [activeWindow, setActiveWindow] = useState<WindowOptions>("fileEx")

  const windows = [
    {
      name: "chat" as WindowOptions,
      icon: <IconRobot size={16}/>,
      component: <ChatInterface/>
    },
    {
      name: "fileEx" as WindowOptions,
      icon: <IconBookUpload size={16}/>,
      component: <FileExplorer/>
    },
  ]

  const handleDragStart = useCallback((e: { clientX: number; }) => {
    isDragging.current = true
    setIsDraggingState(true)
    startX.current = e.clientX // get the current x position
    startWidth.current = windowWidth // current windowWidth

    const onMouseMove = (e: { clientX: number; }) => {
      if (!isDragging.current) return;
      const delta = startX.current - e.clientX // positive = dragging left = chat gets wider
      const newWidth = Math.max(MIN_WIDTH, startWidth.current + delta) // the window cannot be smaller than MIN_WIDTH
      setChatWidth(newWidth)
    }

    const onMouseUp = () => { // remove the listeners
      isDragging.current = false
      setIsDraggingState(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [windowWidth])


  return (
    <div className={cn(
      "h-screen overflow-hidden w-full flex flex-row",
      isDraggingState && "select-none" // don't select text while resizing
    )}>
      {/* Main content */}
      <div className={cn(className, "flex-1 min-w-0")}>
        {children}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="w-1 h-full cursor-col-resize">
      </div>

      {/* Chat panel */}
      <div
        id="chat"
        style={{
          width: windowWidth,
          transition: isDraggingState ? 'none' : 'width 0.2s ease' // smooth only when toggling, not dragging
        }}
        className={cn(
          "shrink-0 overflow-hidden relative p-2 pl-0",
          isDraggingState && "select-none" // don't select text while resizing
        )}
      >
        {windows.filter((w) => w.name === activeWindow).map((window, i) => (
          <React.Fragment key={i}>{window.component}</React.Fragment>
        ))}
      </div>

      {/* Sidebar toolbar */}
      <div
        className="flex flex-col justify-start gap-1 items-center py-3 bg-sidebar border-l border-border/50 p-1"
        style={{width: TOOLBAR_WIDTH}}
      >
        {windows.map((window, i) => (
          <Button
            size="icon"
            key={i}
            onClick={() => {
              if (window.name === activeWindow) {
                setActiveWindow("none")
                savedWidth.current = windowWidth // save the current width before collapsing
                setChatWidth(COLLAPSED_WIDTH)
              } else {
                setActiveWindow(window.name)
                setChatWidth(savedWidth.current)
              }
            }}
            variant="ghost"
            title={activeWindow === window.name ? "Close assistant" : "Open assistant"}
            className={cn(
              "size-8 transition-colors duration-300 ease-in-out",
              (activeWindow === window.name) && "bg-gray-200",
            )}
          >
            {window.icon}
          </Button>
        ))}
      </div>
    </div>
  );
};
