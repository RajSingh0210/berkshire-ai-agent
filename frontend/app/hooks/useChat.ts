import { FormEvent, useCallback, useRef, useState } from "react";
import { ChatMessage, StreamPart, WELCOME_ID } from "../../types/chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: WELCOME_ID,
      role: "assistant",
      content:
        "Ask about Warren Buffett's investment philosophy, Berkshire shareholder letters, capital allocation, moats, managers, or risk.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const assistantMessageId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  function getSessionId(): string {
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }
    return sessionIdRef.current;
  }

  async function submitQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setIsLoading(true);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", citations: [] };

    assistantMessageId.current = assistantMessage.id;
    const nextMessages = [...messages.filter((m) => m.id !== WELCOME_ID), userMessage, assistantMessage];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          messages: nextMessages
            .filter((message) => message.id !== assistantMessage.id)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "The chat request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim().length > 0) {
            const part = JSON.parse(line) as StreamPart;
            const id = assistantMessageId.current;
            if (!id) continue;

            if (part.type === "citations") {
              setMessages((current) => current.map((m) => (m.id === id ? { ...m, citations: part.citations } : m)));
            } else if (part.type === "delta") {
              setMessages((current) => current.map((m) => (m.id === id ? { ...m, content: `${m.content}${part.text}` } : m)));
            } else if (part.type === "error") {
              setError(part.error);
            }
          }
        }
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Something went wrong.";
      setError(message);
      setMessages((current) => current.map((m) => (m.id === assistantMessage.id ? { ...m, content: message } : m)));
    } finally {
      assistantMessageId.current = null;
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    await submitQuestion(question);
  }

  function startNewChat() {
    setMessages([
      {
        id: WELCOME_ID,
        role: "assistant",
        content:
          "Ask about Warren Buffett's investment philosophy, Berkshire shareholder letters, capital allocation, moats, managers, or risk.",
      },
    ]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    messagesEndRef,
    inputRef,
    assistantMessageId,
    scrollToBottom,
    submitQuestion,
    handleSubmit,
    startNewChat,
  };
}
