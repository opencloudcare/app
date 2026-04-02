import React, {useState} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import type {Components} from "react-markdown";
import {oneLight} from "react-syntax-highlighter/dist/esm/styles/prism";
import {IconCheck, IconCopy} from "@tabler/icons-react";

export type Message = { role: 'user' | 'model', content: string }

export const Chat = ({messages, isThinking, isStreaming}: { messages: Message[], isThinking: boolean, isStreaming: boolean }) => {
  return (
    <div className="mt-auto space-y-4 mb-4 px-3">
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          {msg.role === 'user' ? (
            // user messages — right-aligned gradient bubble
            <div className="flex justify-end">
              <div className="bg-linear-to-br from-blue-600 to-blue-300 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] whitespace-pre-wrap shadow-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            // assistant messages — left-aligned, markdown rendered
            <div className="px-2 py-2.5 text-sm text-foreground prose prose-sm font-inter max-w-none
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

// Custom renderer - We can later add override for images and tables if needed
const markdownComponents: Components = {
  // override the <code> tag in the Markdown
  code({className, children, ...props}) {
    const match = /language-(\w+)/.exec(className || "") // get the language (language-xxx)
    const language = match?.[1]

    if (language) { // if there is a language to highligh
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
            style={oneLight} // highlighting theme
            language={language}
            PreTag="div"
            customStyle={{margin: 0, borderRadius: 0, fontSize: "0.85rem", background: "var(--chat-code-background)"}}
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
}


const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]"/>
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]"/>
    <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]"/>
  </div>
)

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
