export interface DocumentMetadata {
  source: string;
  year: number;
  chunkIndex: number;
  page?: number;
}

export interface DocumentChunk {
  content: string;
  metadata: DocumentMetadata;
}

export interface RetrievedChunk extends DocumentChunk {
  id: number;
  score: number;
}

export interface Citation {
  /** Matches inline markers [1], [2], … in the model answer and RAG context. */
  index: number;
  source: string;
  year: number;
  label: string;
  shortLabel: string;
  chunkIndexes: number[];
  pages?: number[];
  score: number;
}
