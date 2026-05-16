import type { DocumentChunk } from './types';
import type { ParsedPdf } from './pdf-parser';

/** Tuned for shareholder letters — smaller chunks reduce mixed-topic pollution in embeddings. */
export const CHUNK_SIZE = 700;
export const CHUNK_OVERLAP = 150;

export function chunkPdfText(pdf: ParsedPdf): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < pdf.text.length) {
    const end = Math.min(start + CHUNK_SIZE, pdf.text.length);
    const content = trimToWordBoundary(pdf.text.slice(start, end));

    if (content.length > 0) {
      chunks.push({
        content,
        metadata: {
          source: pdf.source,
          year: pdf.year,
          chunkIndex,
        },
      });

      chunkIndex += 1;
    }

    if (end === pdf.text.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

export function chunkPdfs(pdfs: ParsedPdf[]): DocumentChunk[] {
  return pdfs.flatMap((pdf) => chunkPdfText(pdf));
}

function trimToWordBoundary(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= CHUNK_SIZE) {
    return normalized;
  }

  const lastSpace = normalized.lastIndexOf(' ', CHUNK_SIZE);
  return normalized.slice(0, lastSpace > 0 ? lastSpace : CHUNK_SIZE).trim();
}
