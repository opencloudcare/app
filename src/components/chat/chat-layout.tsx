import {type ReactNode, useCallback, useRef, useState} from "react";
import {cn} from "@/lib/utils.ts";
import {ChatInterface} from "@/components/chat/chat-interface.tsx";
import {Button} from "@/components/ui/button.tsx";
import {IconRobot} from "@tabler/icons-react";

type ChatLayoutProps = {
  children: ReactNode
  className?: string
}

const MIN_WIDTH = 280
const COLLAPSED_WIDTH = 0
const TOOLBAR_WIDTH = 36

export const ChatLayout = ({children, className}: ChatLayoutProps) => {
  // initialize the variables
  const [chatWidth, setChatWidth] = useState<number>(512)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDraggingState, setIsDraggingState] = useState(false)
  const savedWidth = useRef<number>(512)
  const isDragging = useRef<boolean>(false)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  const handleDragStart = useCallback((e: { clientX: number; }) => {
    isDragging.current = true
    setIsDraggingState(true)
    startX.current = e.clientX // get the current x position
    startWidth.current = chatWidth // current chatWidth

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
  }, [chatWidth])

  const toggleCollapse = useCallback(() => {
    if (isCollapsed) {
      setChatWidth(savedWidth.current) // restore the saved width
      setIsCollapsed(false)
    } else {
      savedWidth.current = chatWidth // save the current width before collapsing
      setChatWidth(COLLAPSED_WIDTH)
      setIsCollapsed(true)
    }
  }, [isCollapsed, chatWidth])

  return (
    <div className={cn(
      "h-full w-full flex flex-row",
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
          width: chatWidth,
          transition: isDraggingState ? 'none' : 'width 0.2s ease' // smooth only when toggling, not dragging
        }}
        className={cn(
          "shrink-0 overflow-hidden relative p-2 pl-0",
          isDraggingState && "select-none" // don't select text while resizing
        )}
      >
        {!isCollapsed && <ChatInterface/>}
      </div>

      {/* Sidebar toolbar */}
      <div
        className="flex flex-col justify-start items-center py-3 bg-sidebar border-l border-border/50 p-1"
        style={{width: TOOLBAR_WIDTH}}
      >
        <Button
          size="icon"
          onClick={toggleCollapse}
          variant="ghost"
          title={isCollapsed ? "Open assistant" : "Close assistant"}
          className={cn(
            "size-8 transition-colors duration-300 ease-in-out",
            !isCollapsed && "bg-gray-200",
          )}
        >
          <IconRobot size={16}/>
        </Button>
      </div>
    </div>
  );
};