import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
}

export interface Chunk {
  content: string;
  metadata: ChunkMetadata;
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: [
    "\n\n",
    "\n",
    ". ",
    "! ",
    "? ",
    "; ",
    ", ",
    " ",
    "",
  ],
});

export async function splitIntoChunks(
  text: string
): Promise<Chunk[]> {
  if (!text.trim()) {
    return [];
  }

  const docs = await splitter.createDocuments([text]);

  return docs.map((doc, index) => ({
    content: doc.pageContent,
    metadata: {
      chunkIndex: index,
      totalChunks: docs.length,
    },
  }));
}