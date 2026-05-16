import { mastra } from "../../../../src/mastra";
import type { Citation } from "../../../../src/mastra/rag/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequest {
  sessionId?: string;
  messages?: ChatMessage[];
}

const sessionMemory = new Map<string, ChatMessage[]>();

export async function POST(req: Request): Promise<Response> {
  const encoder = new TextEncoder();

  try {
    const body = (await req.json()) as ChatRequest;
    const messages = body.messages ?? [];
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user");

    if (!latestUserMessage?.content.trim()) {
      return Response.json({ error: "A user message is required." }, { status: 400 });
    }

    const sessionId = body.sessionId ?? "default";
    const question = latestUserMessage.content.trim();
    const requestHistory = messages.slice(0, Math.max(messages.lastIndexOf(latestUserMessage), 0));
    const previousMessages = sessionMemory.get(sessionId) ?? requestHistory;

    const agentMessages: { role: ChatRole; content: string }[] = [
      ...previousMessages,
      { role: "user", content: question },
    ];

    const agent = mastra.getAgent("berkshireAgent");

    const stream = await agent.stream(agentMessages);

    let assistantText = "";
    let citationsSent = false;

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.fullStream) {
            if (
              !citationsSent &&
              chunk.type === "tool-result" &&
              chunk.payload?.toolName === "berkshireSearchTool"
            ) {
              const toolResults = (chunk.payload?.result as { results: Array<{ source: string; year: number; chunkIndex: number; score: number }> }).results;
              const toolCitations: Citation[] = toolResults.map((r, i) => ({
                index: i + 1,
                source: r.source,
                year: r.year,
                label: `${r.year} Shareholder Letter`,
                shortLabel: `${r.year} letter`,
                chunkIndexes: [r.chunkIndex],
                score: Number(r.score.toFixed(4)),
              }));
              controller.enqueue(encoder.encode(serializePart({ type: "citations", citations: toolCitations })));
              citationsSent = true;
            }

            if (chunk.type === "text-delta" || (chunk.type as string) === "text") {
              const chunkRecord = chunk as Record<string, any>;
              const deltaText = chunkRecord.payload?.text || chunkRecord.textDelta || chunkRecord.text || "";

              assistantText += deltaText;
              controller.enqueue(encoder.encode(serializePart({ type: "delta", text: deltaText })));
            }
          }

          const updatedHistory: ChatMessage[] = [
            ...previousMessages,
            { role: "user" as const, content: question },
            { role: "assistant" as const, content: assistantText },
          ].slice(-10);
          sessionMemory.set(sessionId, updatedHistory);

          controller.enqueue(encoder.encode(serializePart({ type: "done" })));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              serializePart({
                type: "error",
                error: formatChatError(error),
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return Response.json(
      { error: formatChatError(error) },
      { status: 500 },
    );
  }
}

function serializePart(part:
  | { type: "citations"; citations: Citation[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string }
): string {
  return `${JSON.stringify(part)}\n`;
}

function formatChatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("insufficient_quota")) {
    return "The model provider returned insufficient_quota. Restart the dev server so the local Ollama config is loaded.";
  }

  if (message.includes("invalid_api_key")) {
    return "The model provider rejected the API key. If you are using local Ollama, restart the dev server so the Ollama config is loaded.";
  }

  if (message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
    return "Could not reach Ollama. Start Ollama and run: ollama pull llama3.1:8b and ollama pull nomic-embed-text.";
  }

  return message || "Failed to stream response.";
}
