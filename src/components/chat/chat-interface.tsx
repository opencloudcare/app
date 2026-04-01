import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Chat, type Message} from "@/components/chat/chat.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowUp, IconRobot, IconWorldSearch} from "@tabler/icons-react";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 56;

export const ChatInterface = () => {
  const chatTitle = "First Chat";
  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [searchWeb, setSearchWeb] = useState(false)
  const firstChunkRef = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef<boolean>(true)

  useEffect(() => {
    if (scrollContainerRef.current && isAtBottomRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 25
  }, [])

  const send = useCallback(async () => {
    if (!message.trim()) return
    const userMsg: Message = {role: "user", content: message}
    setMessage("")
    setMessages(prev => [...prev, userMsg, {role: "model", content: ""}])
    setIsThinking(true)
    firstChunkRef.current = true

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/ask`, {
      headers: {"Content-Type": "application/json"},
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        contents: [...messages, userMsg],
        searchWeb
      })
    })
    if (!response.ok) {
      const errorMsg = response.status === 429
        ? "I'm currently unavailable due to high demand. Please try again in a moment."
        : "Something went wrong. Please try again."
      setIsThinking(false)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {role: "model", content: errorMsg}
        return updated
      })
      return
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const {done, value} = await reader.read()
      if (done) break;

      if (firstChunkRef.current) {
        firstChunkRef.current = false
        setIsThinking(false)
        setIsStreaming(true)
      }

      const chunk = decoder.decode(value)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "model",
          content: updated[updated.length - 1].content + chunk
        }
        return updated
      })
    }
    setIsStreaming(false)
  }, [message, messages])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }, [send])

  return (
    <div
      className="bg-chat-background w-full h-full rounded-l-2xl shadow-md border border-border/50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm leading-tight truncate">{chatTitle}</h1>
        </div>
      </div>

      <Separator/>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-y-auto flex-1 flex flex-col scrollbar-thin py-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 select-none">
            <div className="size-16 rounded-2xl flex items-center justify-center">
              <IconRobot size={32}/>
            </div>
            <div className="text-center">
              <h2 className="font-semibold text-foreground">OpenCare</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-50 leading-relaxed">
                Ask me anything about your health.
              </p>
            </div>
          </div>
        ) : (
          <Chat messages={messages} isThinking={isThinking} isStreaming={isStreaming}/>
        )}
      </div>

      <Separator/>

      {/* Input */}
      <div className="px-3 py-3 shrink-0">
        <div className="relative">
          <Textarea
            value={message}
            onKeyDown={handleKeyDown}
            onChange={(e) => setMessage(e.target.value)}
            style={{maxHeight: MAX_TEXTAREA_HEIGHT, minHeight: MIN_TEXTAREA_HEIGHT}}
            className="bg-muted/50 rounded-xl border-border/60 pr-12 resize-none text-sm focus-visible:ring-blue-500/30"
            placeholder="Ask about your health..."
          />
          <Button
            onClick={send}
            size="icon"
            disabled={!message.trim()}
            className="absolute bottom-2 right-2 size-8 bg-linear-to-br from-blue-600 to-blue-300 hover:from-blue-700 hover:to-blue-500 disabled:opacity-40 shadow-sm"
          >
            <IconArrowUp size={14}/>
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setSearchWeb(prev => !prev)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
              searchWeb
                ? "bg-blue-500/10 border-blue-500/40 text-blue-500"
                : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <IconWorldSearch size={13}/>
            Web search
          </button>
          <p className="text-xs tracking-tight text-muted-foreground">
            AI can make mistakes. Double-check responses.
          </p>
        </div>
      </div>

    </div>
  );
};