import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Chat, type Message} from "@/components/chat/chat.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowUp, IconRobot} from "@tabler/icons-react";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 56;

const MOCK_RESPONSES = [
  "Hello nice to meet you!\nHow are you doing?",
  "Great to hear. What can I help you with today?",
  "Uuuh you are making pizza for the first time how exciting.\nLet me give you a hand and write you a recipe.\n" +
  "You will need:\n- 3 eggs\n- 500ml of milk\n- 1kg of flour\n- toppings",
  "Your welcome happy to help."
]

export const ChatInterface = () => {
  const chatTitle = "First Chat";
  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages])

  const send = useCallback(() => {
    if (!message.trim()) return
    const userMsg: Message = {role: 'user', content: message}
    const assistantMsg: Message = {role: 'assistant', content: MOCK_RESPONSES[messages.length / 2 % MOCK_RESPONSES.length]}
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setMessage("")
  }, [message])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }, [send])

  return (
    <div className="bg-background w-full h-full rounded-l-2xl shadow-md border border-border/50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2.5 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm leading-tight truncate">{chatTitle}</h1>
        </div>
      </div>

      <Separator/>

      {/* Messages */}
      <div className="overflow-y-auto flex-1 flex flex-col scrollbar-thin py-2">
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
          <>
            <Chat messages={messages}/>
            <div ref={bottomRef}/>
          </>
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