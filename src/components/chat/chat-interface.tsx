import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Chat, type Message} from "@/components/chat/chat.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowUp} from "@tabler/icons-react";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 64;

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
    const assistantMsg: Message = {role: 'assistant', content: MOCK_RESPONSES[messages.length/2 % MOCK_RESPONSES.length]}
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
    <div className="bg-sidebar-accent w-full h-full rounded-l-2xl p-3">
      <div className="bg-white overflow-hidden rounded-xl flex-1 flex flex-col h-full p-3 gap-2">
        <h1 className="font-medium">{chatTitle}</h1>
        <Separator/>
        <div className="overflow-y-auto flex-1 flex flex-col h-full">
          <Chat messages={messages}/>
          <div ref={bottomRef}/>
        </div>
        <div className="relative h-auto w-full" style={{minHeight: MIN_TEXTAREA_HEIGHT}}>
          <Textarea value={message}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{maxHeight: MAX_TEXTAREA_HEIGHT, minHeight: MIN_TEXTAREA_HEIGHT}}
                    className="bg-white rounded-xl" placeholder="Chat with our agent"/>
          <Button onClick={send} size="icon" className="absolute bottom-1 right-1 size-8">
            <IconArrowUp/>
          </Button>
        </div>
      </div>
    </div>
  );
};