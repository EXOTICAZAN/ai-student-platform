import { createClient } from "@/lib/supabase/server";
import { createEmbedding } from "@/lib/ai/embeddings";

export interface SimilarChunk {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

export async function searchSimilarChunks(
  query: string,
  documentId?: string,
  matchCount: number = 5
): Promise<SimilarChunk[]> {
  const supabase = await createClient();

  if (!query.trim()) {
    return [];
  }

  const queryEmbedding = await createEmbedding(query);

  const { data, error } = await supabase.rpc(
    "match_document_chunks",
    {
      query_embedding: queryEmbedding,
      match_document_id: documentId ?? null,
      match_count: matchCount,
    }
  );

  if (error) {
    console.error(
      "❌ Similarity search error:",
      error
    );

    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map((chunk: SimilarChunk) => ({
    id: chunk.id,
    document_id: chunk.document_id,
    user_id: chunk.user_id,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    similarity: Number(chunk.similarity),
  }));
}