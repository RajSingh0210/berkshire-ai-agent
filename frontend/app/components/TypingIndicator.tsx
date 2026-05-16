export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Thinking">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-black" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-black" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-black" />
    </div>
  );
}
