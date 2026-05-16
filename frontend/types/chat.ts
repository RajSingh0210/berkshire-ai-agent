export interface Citation {
  index: number;
  source: string;
  year: number;
  label: string;
  shortLabel: string;
  chunkIndexes: number[];
  pages?: number[];
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export type StreamPart =
  | { type: "citations"; citations: Citation[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

export const SUGGESTED_QUESTIONS = [
  "What does Warren Buffett think about cryptocurrency?",
  "How has Berkshire's investment strategy evolved over the past 5 years?",
  "What companies did Berkshire acquire in 2023?",
  "What is Buffett's view on market volatility and timing?",
];

export const WELCOME_ID = "welcome";
