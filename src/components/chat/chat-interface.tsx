import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Chat, type Message} from "@/components/chat/chat.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowUp, IconMessageCirclePlus, IconRobot, IconWorldSearch} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 56;
const MIN_SCROLL_HEIGHT_TO_AUTOSCROLL = 25;
const NEW_CHAT_TITLE = "New Chat"

export const ChatInterface = () => {
  const [chatTitle, setChatTitle] = useState<string>(NEW_CHAT_TITLE)
  const [message, setMessage] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([]) // whole conversation
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [searchWeb, setSearchWeb] = useState(false)
  const firstChunkRef = useRef(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null) // chat container for autoscroll
  const isAtBottomRef = useRef<boolean>(true) // check if you are at the bottom of a scrollContainerRef
  const conversationIdRef = useRef<string | null>(null)
  const [allConversations, setAllConversations] = useState<{ id: string, title: string }[] | null>(null);


  // initial conversation load
  useEffect(() => {
    fetchConversations()
    const savedId = localStorage.getItem("conversationId")
    const savedTitle = localStorage.getItem("conversationTitle")
    if (savedId) {
      loadConversation(savedId)
      if (savedTitle) setChatTitle(savedTitle)
    }
   }, []);

  // Update the end of the chat container and scroll to the bottom if at the bottom
  useEffect(() => {
    if (scrollContainerRef.current && isAtBottomRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  // Helper function for saving the conversation id and title in state and local storage
  const setConversationId = useCallback((id: string | null, title?: string) => {
    conversationIdRef.current = id
    if (id) {
      localStorage.setItem("conversationId", id)
      if (title) localStorage.setItem("conversationTitle", title)
    } else {
      localStorage.removeItem("conversationId")
      localStorage.removeItem("conversationTitle")
    }
  }, [])


  // Load all conversation
  const fetchConversations = useCallback(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/conversations/`, {
      method: "GET",
      credentials: "include",
    }).then(res => res.json()).then(res => setAllConversations(res.data))
  }, [])

  // Load a desired conversation based on the conversation id
  const loadConversation = async (convId: string) => {
    setConversationId(convId);
    setMessages([]) // reset the messages
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/conversations/${convId}`, {
      method: "GET",
      credentials: "include",
    }).then(res => res.json())

    for (const row of response.data) { // iterate through the messages and set the new ones
      setMessages(prev => [...prev, {role: row.role, content: row.content}])
    }
  }


  // This one lets you force scroll if you want to read the chat at your own pase and not follow the
  // stream of content
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < MIN_SCROLL_HEIGHT_TO_AUTOSCROLL
  }, [])


  // SEND MESSAGE FUNCTION
  const send = useCallback(async () => {
    if (!message.trim()) return
    const userMsg: Message = {role: "user", content: message}
    setMessage("")
    let isNewConversation = false;

    if (messages.length === 0) { // new conversation -> create a new one
      const uuid = crypto.randomUUID();
      setConversationId(uuid)
      const convRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/conversations`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          conversationId: uuid,
          contents: [userMsg],
        })
      })
      if (!convRes.ok) return;
      isNewConversation = true;
    }
    // pre-set the message so that the content stream can be inserted
    setMessages(prev => [...prev, userMsg, {role: "model", content: ""}])
    setIsThinking(true)
    firstChunkRef.current = true

    // send the message to LLM
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/ask`, {
      headers: {"Content-Type": "application/json"},
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        conversationId: conversationIdRef.current,
        contents: [...messages, userMsg],
        searchWeb
      })
    })

    if (!response.ok) {
      const errorMsg = response.status === 429 // -> usage error code
        ? "I'm currently unavailable due to high demand. Please try again in a moment."
        : "Something went wrong. Please try again."
      setIsThinking(false)
      setMessages(prev => { // show the error message in chat
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
      setMessages(prev => { // stream the response
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "model",
          content: updated[updated.length - 1].content + chunk
        }
        return updated
      })
    }
    setIsStreaming(false)

    if (isNewConversation) { // chat title rename functionality
      // generate the new title
      const titleRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/get-chat-title`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({contents: [userMsg]})
      })
      const title = await titleRes.text()
      setChatTitle(title)
      setConversationId(conversationIdRef.current, title)

      // update the database with a new title
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/conversations/${conversationIdRef.current}/title`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({title})
      })
      fetchConversations() // refetch the conversation -> update list
    }
  }, [message, messages])


  // Send message by pressing the enter key (filter out enter + shift)
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
        <button className="cursor-pointer" onClick={() => { // new message button
          setConversationId(null, NEW_CHAT_TITLE)
          setChatTitle(NEW_CHAT_TITLE)
          setMessages([])
        }}>
          <IconMessageCirclePlus size={20} strokeWidth="2.5px"/>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer focus:outline-none">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> {/* Chat Icon */}
              <path fill="var(--color-foreground)"
                    d="M10.001 14.676v-.062c0-2.509 2.017-4.618 4.753-5.233C14.39 7.079 11.96 5.2 8.9 5.2C5.58 5.2 3 7.413 3 9.98c0 .969.36 1.9 1.04 2.698q.048.058.152.165a3.57 3.57 0 0 1 1.002 2.238a3.6 3.6 0 0 1 2.363-.442q.25.039.405.06A7.3 7.3 0 0 0 10 14.676m.457 1.951a9.2 9.2 0 0 1-2.753.055a19 19 0 0 1-.454-.067a1.6 1.6 0 0 0-1.08.212l-1.904 1.147a.8.8 0 0 1-.49.118a.79.79 0 0 1-.729-.851l.15-1.781a1.57 1.57 0 0 0-.439-1.223a6 6 0 0 1-.241-.262C1.563 12.855 1 11.473 1 9.979C1 6.235 4.537 3.2 8.9 3.2c4.06 0 7.403 2.627 7.85 6.008c3.371.153 6.05 2.515 6.05 5.406c0 1.193-.456 2.296-1.229 3.19q-.076.09-.195.21a1.24 1.24 0 0 0-.356.976l.121 1.423a.635.635 0 0 1-.59.68a.66.66 0 0 1-.396-.094l-1.544-.917a1.32 1.32 0 0 0-.874-.169q-.22.034-.368.053q-.475.061-.969.062c-2.694 0-4.998-1.408-5.943-3.401m6.977 1.31a3.3 3.3 0 0 1 1.675.174a3.25 3.25 0 0 1 .842-1.502q.076-.077.106-.112c.489-.565.743-1.213.743-1.883c0-1.805-1.903-3.414-4.4-3.414S12 12.81 12 14.614s1.903 3.414 4.4 3.414a6 6 0 0 0 .714-.046q.121-.015.32-.046"/>
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Chat History</DropdownMenuLabel>
            <DropdownMenuGroup>
              {allConversations && allConversations.length > 0 ? allConversations.map((conv) => (
                <DropdownMenuItem key={conv.id} onClick={() => {
                  loadConversation(conv.id)
                  setChatTitle(conv.title)
                  setConversationId(conv.id, conv.title)
                }}>
                  {conv.title}
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled>
                  <span className="text-xs italic">No previous chats.</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator/>

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll}
           className="overflow-y-auto flex-1 flex flex-col scrollbar-thin py-2">
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