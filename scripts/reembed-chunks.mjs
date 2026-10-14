// Re-embeds document_chunks after a change of embedding model.
//
// Migration 003 rebuilds document_chunks.embedding at the new width and
// leaves existing vectors NULL, preserving the chunk text. This script
// regenerates those vectors locally — no PDF re-upload needed.
//
// It imports the application's own embedding module so the model and
// dimension can never drift from what the running app produces.
//
// Usage:
//   node scripts/reembed-chunks.mjs             # only NULL embeddings
//   node scripts/reembed-chunks.mjs --all       # every chunk
//   node scripts/reembed-chunks.mjs --dry-run   # report, write nothing
//
// Requires SUPABASE_SERVICE_ROLE_KEY, because RLS would otherwise hide
// other users' chunks from the backfill.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: new URL("../.env.local", import.meta.url) });

const { createEmbeddings, DIMENSIONS } = await import(
  "../lib/ai/embeddings.ts"
);

const EMBED_BATCH = 32;
const WRITE_CONCURRENCY = 8;
const PAGE_SIZE = 500;

const args = new Set(process.argv.slice(2));
const reembedAll = args.has("--all");
const dryRun = args.has("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

// service_role bypasses RLS. This script only reads chunk text and writes
// embeddings, and must never be reachable from the browser.
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchPending() {
  const rows = [];
  let from = 0;

  for (;;) {
    let query = supabase
      .from("document_chunks")
      .select("id, document_id, chunk_index, content")
      .order("document_id")
      .order("chunk_index")
      .range(from, from + PAGE_SIZE - 1);

    if (!reembedAll) query = query.is("embedding", null);

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        throw new Error(
          "document_chunks is not reachable. Run supabase/migrations/002 and 003 first."
        );
      }
      throw new Error(`${error.code ?? ""} ${error.message}`.trim());
    }

    if (!data?.length) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function writeBack(id, embedding) {
  const { error } = await supabase
    .from("document_chunks")
    .update({ embedding })
    .eq("id", id);

  if (error) throw new Error(`row ${id}: ${error.message}`);
}

async function runPool(items, worker, size) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

console.log(
  `Re-embedding ${reembedAll ? "ALL" : "pending"} chunks at ${DIMENSIONS} dimensions${dryRun ? " (dry run)" : ""}`
);

const rows = await fetchPending();
console.log(`Found ${rows.length} chunk(s).`);

if (!rows.length) {
  console.log("Nothing to do.");
  process.exit(0);
}

if (dryRun) {
  const byDocument = new Map();
  for (const r of rows) {
    byDocument.set(r.document_id, (byDocument.get(r.document_id) ?? 0) + 1);
  }
  console.log(`Across ${byDocument.size} document(s):`);
  for (const [doc, count] of byDocument) console.log(`  ${doc}  ${count} chunks`);
  process.exit(0);
}

let done = 0;
let failed = 0;
const started = Date.now();

for (let i = 0; i < rows.length; i += EMBED_BATCH) {
  const batch = rows.slice(i, i + EMBED_BATCH);

  // Local inference is CPU-bound, so embedding runs sequentially and only
  // the network writes are parallelised.
  const vectors = await createEmbeddings(batch.map((r) => r.content));

  const bad = vectors.findIndex((v) => v.length !== DIMENSIONS);
  if (bad !== -1) {
    throw new Error(
      `Model produced ${vectors[bad].length} dims for chunk ${batch[bad].id}, expected ${DIMENSIONS}`
    );
  }

  await runPool(
    batch.map((row, j) => ({ row, vector: vectors[j] })),
    async ({ row, vector }) => {
      try {
        await writeBack(row.id, vector);
        done++;
      } catch (error) {
        failed++;
        console.error(`  ! ${error.message}`);
      }
    },
    WRITE_CONCURRENCY
  );

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `  ${Math.min(i + EMBED_BATCH, rows.length)}/${rows.length} chunks  (${elapsed}s)`
  );
}

console.log(
  `\nDone. embedded=${done} failed=${failed} elapsed=${((Date.now() - started) / 1000).toFixed(1)}s`
);

const { count } = await supabase
  .from("document_chunks")
  .select("id", { count: "exact", head: true })
  .is("embedding", null);

console.log(`Chunks still without an embedding: ${count ?? "unknown"}`);

process.exit(failed > 0 ? 1 : 0);
