"use client";

import { useEffect } from "react";
import { ChatMessageBubble } from "./components/ChatMessageBubble";
import { SUGGESTED_QUESTIONS, WELCOME_ID } from "../types/chat";
import { useChat } from "./hooks/useChat";

export default function Home() {
  const {
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
  } = useChat();

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const showSuggestions = messages.length === 1 && messages[0]?.id === WELCOME_ID;

  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/50">
              Berkshire Intelligence
            </p>
            <h1 className="font-serif mt-1 text-2xl leading-tight sm:text-[1.75rem]">
              Shareholder letter Q&amp;A
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-black/55">
              Grounded in Berkshire Hathaway letters, 2019–2024.
            </p>
          </div>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={startNewChat}
              className="shrink-0 border border-black px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              New chat
            </button>
          )}
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 sm:px-6">
        <div className="flex flex-1 flex-col gap-5">
          {messages.map((message, index) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              index={index}
              isStreaming={isLoading && message.id === assistantMessageId.current && !message.content}
            />
          ))}

          {showSuggestions && (
            <div className="animate-fade-up border border-dashed border-black/20 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/45">
                Try asking
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isLoading}
                    onClick={() => submitQuestion(question)}
                    className="border border-black/20 px-3 py-2 text-left text-xs leading-snug transition hover:border-black hover:bg-black hover:text-white disabled:opacity-40"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>
      </section>

      <footer className="sticky bottom-0 border-t border-black/10 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-6">
          {error && (
            <p className="mb-3 border border-black px-3 py-2 text-xs text-black" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask about moats, intrinsic value, capital allocation…"
              rows={1}
              disabled={isLoading}
              className="max-h-32 min-h-11 flex-1 resize-none border border-black/20 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-black/35 focus:border-black disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className="flex h-11 min-w-11 items-center justify-center border border-black bg-black px-4 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:border-black/20 disabled:bg-black/20 disabled:text-white/80"
              aria-label="Send message"
            >
              {isLoading ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "→"
              )}
            </button>
          </form>
          <p className="mt-2 text-[10px] text-black/40">Enter to send · Shift+Enter for new line</p>
        </div>
      </footer>
    </main>
  );
}
