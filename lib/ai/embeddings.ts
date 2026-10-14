import os from "os";
import path from "path";

import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

// =============================================================
// Local embeddings via transformers.js.
//
// Groq has no embeddings endpoint, so retrieval runs a small ONNX
// model in-process instead of calling an API. No key, no per-call
// cost, and document text never leaves the server.
//
// Switching provider changed the vector width from 768 (Gemini) to
// 384, which is why migration 003 rebuilds document_chunks.embedding
// and why previously ingested documents must be re-embedded.
// =============================================================

const MODEL =
  process.env.EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2";

export const DIMENSIONS = 384;

// Embedding a whole PDF in one call can exhaust memory, so chunks go
// through in slices.
const BATCH_SIZE = 16;

// Deliberately outside the project tree. Turbopack's file tracer walks the
// whole project directory when bundling, and reading the ~90 MB model.onnx into
// it panics the build with OS error 1450. The package default is worse still:
// it lives in node_modules, which is read-only on serverless platforms.
env.cacheDir =
  process.env.EMBEDDING_CACHE_DIR ??
  path.join(os.homedir(), ".cache", "eduforge-embeddings");

let extractor: FeatureExtractionPipeline | null = null;
let loading: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return Promise.resolve(extractor);

  // Concurrent requests must share one load — a cold load takes seconds,
  // and stampeding it would hold several copies of the model in memory.
  if (!loading) {
    loading = pipeline("feature-extraction", MODEL).then(
      (loaded) => {
        extractor = loaded;
        return loaded;
      },
      (error) => {
        loading = null;
        throw error;
      }
    );
  }

  return loading;
}

async function embed(texts: string[]): Promise<number[][]> {
  const model = await getExtractor();
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const output = await model(batch, {
      pooling: "mean",
      normalize: true,
    });

    const dims = output.dims as number[];
    const rows = dims[0];
    const width = dims[dims.length - 1];

    if (width !== DIMENSIONS) {
      throw new Error(
        `Expected ${DIMENSIONS}-dimensional embedding, got ${width}`
      );
    }

    const flat = Array.from(output.data as Float32Array);

    for (let r = 0; r < rows; r++) {
      vectors.push(flat.slice(r * width, (r + 1) * width));
    }
  }

  return vectors;
}

export async function createEmbedding(
  text: string
): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Cannot create embedding from empty text");
  }

  const [vector] = await embed([text]);
  return vector;
}

export async function createEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!texts.length) {
    throw new Error(
      "Cannot create embeddings from empty text array"
    );
  }

  if (texts.some((text) => !text.trim())) {
    throw new Error("Cannot create embedding from empty text");
  }

  return embed(texts);
}
