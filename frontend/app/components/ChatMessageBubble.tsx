import { ChatMessage } from "../../types/chat";
import { getUniqueSourceLabels, renderFormattedMessage } from "../helpers/chat";
import { TypingIndicator } from "./TypingIndicator";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  index: number;
  isStreaming: boolean;
}

export function ChatMessageBubble({ message, index, isStreaming }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={`animate-fade-up flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
    >
      <div
        className={`max-w-[92%] sm:max-w-[85%] ${
          isUser
            ? "bg-black px-4 py-3 text-sm leading-relaxed text-white"
            : "border border-black/15 bg-white px-4 py-4 text-sm leading-relaxed text-black shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        }`}
      >
        {isStreaming ? (
          <TypingIndicator />
        ) : message.content ? (
          isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              <div className="space-y-4">
                {renderFormattedMessage(message.content, message.citations)}
              </div>
              {getUniqueSourceLabels(message.citations).length > 0 ? (
                <div className="mt-5 border-t border-black/10 pt-4">
                  <p className="text-xs font-semibold text-black">Sources:</p>
                  <ul className="mt-2 space-y-1.5">
                    {getUniqueSourceLabels(message.citations).map((label) => (
                      <li key={label} className="flex gap-2 text-sm text-black/80">
                        <span className="text-black/50">•</span>
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )
        ) : null}
      </div>
    </article>
  );
}
