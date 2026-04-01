import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Chat, type Message} from "@/components/chat/chat.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowUp, IconRobot} from "@tabler/icons-react";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 56;

export const ChatInterface = () => {
  const chatTitle = "First Chat";
  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  const send = useCallback(async () => {
    if (!message.trim()) return
    const userMsg: Message = {role: "user", content: message}
    setMessage("")
    setMessages(prev => [...prev, userMsg, {role: "model", content: ""}])

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/ask`, {
      headers: {"Content-Type": "application/json"},
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        contents: [...messages, userMsg]
      })
    })
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const {done, value} = await reader.read()
      if (done) break;

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
      <div ref={scrollContainerRef} className="overflow-y-auto flex-1 flex flex-col scrollbar-thin py-2">
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
          <Chat messages={messages}/>
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
        <p className="text-xs tracking-tight text-muted-foreground text-center mt-2">
          We are using LLM/AI model that can make mistakes. Please double-check responses.
        </p>
      </div>

    </div>
  );
};