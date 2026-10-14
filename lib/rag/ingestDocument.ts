import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/pdf/extractText";
import { splitIntoChunks } from "@/lib/chunking/splitter";
import { createEmbeddings } from "@/lib/ai/embeddings";

export async function ingestDocument(
  documentId: string,
  userId: string,
  buffer: Buffer,
  // Callers that already parsed the PDF pass the text to avoid a second parse.
  extractedText?: string
) {
  const supabase = await createClient();

  // 1. Extract text
  const text = extractedText ?? (await extractPdfText(buffer));

  if (!text.trim()) {
    throw new Error("No text could be extracted from PDF");
  }

  // 2. Split into chunks
  const chunks = await splitIntoChunks(text);

  if (chunks.length === 0) {
    throw new Error("No chunks were created");
  }

  // 3. Create embeddings
  const texts = chunks.map((chunk) => chunk.content);

  const embeddings = await createEmbeddings(texts);

  // 4. Prepare database rows
  const rows = chunks.map((chunk, index) => ({
    document_id: documentId,
    user_id: userId,
    chunk_index: index,
    content: chunk.content,
    embedding: embeddings[index],
  }));

  // 5. Store in pgvector
  // Re-processing the same document must replace its chunks, not append to
  // them — otherwise retrieval returns every passage twice and the table grows
  // on every retry.
  const { error: deleteError } = await supabase
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Chunk cleanup error:", deleteError);
    throw new Error("Could not clear previous chunks for this document");
  }

  const { error } = await supabase
    .from("document_chunks")
    .insert(rows);

  if (error) {
    console.error("Vector database error:", error);
    throw new Error("Could not store document chunks");
  }

  return {
    documentId,
    chunks: chunks.length,
    characters: text.length,
  };
}