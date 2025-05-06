import * as React from "react"
import { useScrollIntoView } from "@/hooks/use-scroll-into-view"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const scrollRef = useScrollIntoView();
    
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-md border border-input bg-background px-4 py-3 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-base",
          className
        )}
        ref={(node) => {
          // Combina as duas refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          scrollRef.current = node;
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
