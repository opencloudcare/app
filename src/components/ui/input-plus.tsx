import * as React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils.ts";
import {IconLoader2} from "@tabler/icons-react";

export const InputPlus = ({className, style, type, processFunction, indicator, callbackFunction, onEscape, onKeyDown, ...props}: React.ComponentProps<"input"> & {
  processFunction: (value?: any) => Promise<any>,
  callbackFunction?: () => any,
  onEscape?: () => void,
  indicator: React.ReactNode
}) => {
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { // initialize the counter
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current)
    }
  }, [])

  useEffect(() => { // ensure that the input gets focus (if display != none)
    const isVisible = (style as React.CSSProperties)?.display !== "none"
    if (isVisible && onEscape) inputRef.current?.focus()
  }, [(style as React.CSSProperties)?.display])

  // confirm the action by pressing enter
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Escape") {
      e.currentTarget.blur()
      onEscape?.()
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
      setLoading(true)
      const result = await processFunction()
      setLoading(false)
      if (result) {
        setSuccess(true)
        if (successTimer.current) clearTimeout(successTimer.current)
        successTimer.current = setTimeout(() => {callbackFunction?.();setSuccess(false)}, 2000)
      } else {
        setSuccess(false)
      }
    }
  }, [processFunction, callbackFunction, onEscape])

  return (
    <div style={style} className=
           "h-9 w-full inline-flex items-center justify-between min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40">
      <input
        type={type}
        data-slot="input"
        className={cn("w-full focus:ring-0 focus-visible:ring-0 outline-none", className)}
        ref={inputRef}
        {...props}
        onKeyDown={(e) => { handleKeyDown(e); onKeyDown?.(e) }}
      />
      {/* Fade in/out the indicators */}
      <span className="relative size-3.5 shrink-0">
        <span
          className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-200", loading ? "opacity-100" : "opacity-0 pointer-events-none")}>
          <IconLoader2 className="animate-spin" size={14}/>
        </span>
        <span
          className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-200", success ? "opacity-100" : "opacity-0 pointer-events-none")}>
          {indicator}
        </span>
      </span>
    </div>
  );
};
