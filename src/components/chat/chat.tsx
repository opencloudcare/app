import React, {useState} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {Components} from "react-markdown";
import SyntaxHighlighter from "@/components/chat/languages";
import {oneDark, oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {IconCheck, IconCopy} from "@tabler/icons-react";
import {useTheme} from "@/components/ui/theme-provider.tsx";

export type Message = { role: 'user' | 'model', content: string, images?: string[] }

const IMAGE_URL_RE = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg|bmp|avif)(?:[?#]\S*)?/gi
const ANY_URL_RE = /https?:\/\/\S+/gi

function parseUserContent(content: string): { imageUrls: string[], maybeImageUrls: string[], text: string } {
  // Extract known image extension URLs — render directly
  IMAGE_URL_RE.lastIndex = 0
  const imageUrls = Array.from(content.matchAll(IMAGE_URL_RE), m => m[0])

  // Extract remaining URLs (no recognised extension) — try as image with fallback
  IMAGE_URL_RE.lastIndex = 0
  ANY_URL_RE.lastIndex = 0
  const knownSet = new Set(imageUrls)
  const maybeImageUrls = Array.from(content.matchAll(ANY_URL_RE), m => m[0]).filter(u => !knownSet.has(u))

  // Strip all URLs from the displayed text
  ANY_URL_RE.lastIndex = 0
  const text = content.replace(ANY_URL_RE, "").trim()

  return { imageUrls, maybeImageUrls, text }
}

export const Chat = ({messages, isThinking, isStreaming}: { messages: Message[], isThinking: boolean, isStreaming: boolean }) => {
  return (
    <div className="mt-auto space-y-4 mb-4 px-3">
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          {msg.role === 'user' ? (
            // user messages — right-aligned gradient bubble
            (() => {
              const { imageUrls, maybeImageUrls, text } = parseUserContent(msg.content)
              const allImages = [...(msg.images ?? []), ...imageUrls]
              return (
                <div className="flex justify-end">
                  <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                    {text && (
                      <div className="bg-linear-to-br from-blue-600 to-blue-300 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm whitespace-pre-wrap shadow-sm">
                        {text}
                      </div>
                    )}
                    {allImages.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {allImages.map((src, idx) => (
                          <img
                            key={idx}
                            src={src}
                            alt={`attachment-${idx + 1}`}
                            className="max-h-64 max-w-full rounded-xl object-cover shadow-sm"
                          />
                        ))}
                      </div>
                    )}
                    {maybeImageUrls.map((src, idx) => (
                      <MaybeImage key={idx} src={src}/>
                    ))}
                  </div>
                </div>
              )
            })()
          ) : (
            // assistant messages — left-aligned, markdown rendered
            <div className="px-2 py-2.5 text-sm text-foreground prose prose-sm dark:prose-invert font-inter max-w-none
              prose-p:my-1 prose-p:leading-relaxed
              prose-headings:font-semibold prose-headings:my-2
              prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5
              prose-ol:my-1 prose-ol:pl-4
              prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-none
              prose-code:before:content-none prose-code:after:content-none
              prose-strong:font-semibold
              prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-3 prose-blockquote:text-muted-foreground">
              {isThinking && i === messages.length - 1 ? (
                <span className="inline-flex gap-2 items-center">Thinking <ThinkingDots/></span>
              ) : (
                <>
                  <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                  </Markdown>
                  {isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-0.5 h-3.5 bg-foreground ml-0.5 animate-blink align-middle"/>
                  )}
                </>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const CodeBlock = ({className, children, ...props}: React.ComponentPropsWithoutRef<"code">) => {
  const {theme} = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const match = /language-(\w+)/.exec(className || "")
  const language = match?.[1]

  if (language) {
    const code = String(children).replace(/\n$/, "")
    return (
      <div className="rounded-lg overflow-hidden border border-border/60 my-2">

        {/* language label bar */}
        <div className="flex items-center justify-between px-3 pt-1.5 bg-chat-code-background">
          <span className="text-[10px] font-thin font-mono text-muted-foreground">{language}</span>
          <CopyButton code={code}/>
        </div>

        {/* highlighted code */}
        <SyntaxHighlighter
          style={{...(isDark ? oneDark : oneLight), 'pre[class*="language-"]': {background: "transparent"}, 'code[class*="language-"]': {background: "transparent"}}}
          language={language}
          PreTag="div"
          customStyle={{margin: 0, borderRadius: 0, fontSize: "0.85rem", padding: "12px" , background: "var(--chat-code-background)"}}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    )
  }

  // inline code block
  return (
    <code className="bg-chat-code-background border border-border/60 text-chat-code-foreground font-thin px-1 py-0.5 rounded text-xs font-mono" {...props}>
      {children}
    </code>
  )
}

// Custom renderer - We can later add override for images and tables if needed
const markdownComponents: Components = {
  code: CodeBlock,
  img({src, alt}) {
    if (!src) return null
    return (
      <img
        src={src}
        alt={alt ?? ""}
        className="rounded-xl max-w-full max-h-96 object-contain my-2 border border-border/60 shadow-sm"
      />
    )
  }
}


const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]"/>
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]"/>
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]"/>
  </div>
)

// Tries to render a URL as an image; falls back to a plain link if it fails to load
const MaybeImage = ({src}: { src: string }) => {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="bg-linear-to-br from-blue-600 to-blue-300 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm">
        <a href={src} target="_blank" rel="noopener noreferrer" className="underline break-all">{src}</a>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt="attachment"
      className="max-h-64 max-w-full rounded-xl object-cover shadow-sm"
      onError={() => setFailed(true)}
    />
  )
}

// Copy button component
const CopyButton = ({code}: { code: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      title="Copy code"
    >
      {copied
        ? <IconCheck size={13}/>
        : <IconCopy size={13}/>
      }
    </button>
  )
}
