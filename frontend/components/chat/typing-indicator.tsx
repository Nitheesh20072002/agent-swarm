export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      {/* Avatar placeholder */}
      <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold bg-secondary text-secondary-foreground">
        A
      </div>

      {/* Typing animation */}
      <div className="flex flex-col gap-1 items-start">
        <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground ml-4">
          Agent is typing...
        </span>
      </div>
    </div>
  )
}
