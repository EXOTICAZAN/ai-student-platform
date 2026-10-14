import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ingestDocument } from "@/lib/rag/ingestDocument";
import { isUuid, readJson } from "@/lib/api/guard";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Embedding runs locally and pins a CPU core for the whole document.
    const limit = await consume("process_document", user.id, 10);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    const body = await readJson<{ documentId?: string }>(req);
    const documentId = body?.documentId;

    if (!isUuid(documentId)) {
      return NextResponse.json(
        { error: "A valid documentId is required" },
        { status: 400 }
      );
    }

    // Get document metadata
    const { data: document, error: documentError } =
      await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", user.id)
        .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Download PDF from Supabase Storage
    const { data: file, error: downloadError } =
      await supabase.storage
        .from("documents")
        .download(document.storage_path);

    if (downloadError || !file) {
      return NextResponse.json(
        { error: "Could not download the stored file." },
        { status: 500 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process document
    const result = await ingestDocument(
      document.id,
      user.id,
      buffer
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Document processing failed:", error);

    return NextResponse.json(
      { error: "Document processing failed. Please try again." },
      { status: 500 }
    );
  }
}