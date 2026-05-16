import type { RetrievedChunk } from './types';
import { buildRagContext } from './retrieval';

export function buildAnswerPrompt(question: string, chunks: RetrievedChunk[]): string {
  const excerptBlock =
    chunks.length > 0
      ? buildRagContext(chunks)
      : 'No letter excerpts were retrieved for this question.';

  return `
Answer using ONLY the shareholder letter excerpts below.

Requirements:
1. Ground every claim in the excerpts. Cite the letter year in the prose (e.g. "In the 2022 letter...").
2. State what Buffett and Berkshire actually wrote — do not speculate ("suggests", "implies", "likely", "this approach indicates").
3. Synthesize concisely. Do not repeat the same idea or phrase twice.
4. No generic AI filler (see agent rules).

Format — follow exactly:
- Line 1–2: Short direct answer (max ~50 words).
- Blank line.
- Four to seven bullets, each on its own line starting with "• " (bullet character). One idea per bullet; include year when citing a letter.
- Optional: blank line + one short closing sentence only if needed.
- No long paragraphs. No markdown. No [1] markers. No "Sources" section at the end.

Retrieved excerpts:
${excerptBlock}

Question:
${question}

Write the answer now.
`.trim();
}
