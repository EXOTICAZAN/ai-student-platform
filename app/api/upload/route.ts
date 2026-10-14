import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/pdf/extractText";
import { ingestDocument, withDocumentIngestionLock } from "@/lib/rag/ingestDocument";
import { consume, tooManyRequests } from "@/lib/api/rateLimit";

// The whole file is buffered in memory before parsing, so an uncapped upload
// is a memory-exhaustion vector. 25 MB is generous for a text PDF.
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // ==========================
    // AUTHENTICATION
    // ==========================

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
    const limit = await consume("upload", user.id, 10);
    if (!limit.ok) return tooManyRequests(limit.retryAfterMs);

    // ==========================
    // READ FORM DATA
    // ==========================

    // Reject on the declared length before buffering the body at all.
    const declared = Number(req.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large. The limit is ${MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const chatId = formData.get("chatId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File is too large. The limit is ${MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    // Only PDFs can be parsed downstream; anything else fails deep inside
    // pdf2json with an opaque message. The declared type is client-controlled
    // (and may be empty), so the file signature is checked below as well.
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 415 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // ==========================
    // VERIFY CHAT OWNERSHIP
    // ==========================

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: "Chat not found or unauthorized" },
        { status: 404 }
      );
    }

    // ==========================
    // GENERATE SAFE FILENAME
    // ==========================

    // Never derive the storage key from a user-supplied filename.
    const safeFileName = `${crypto.randomUUID()}.pdf`;

    const filePath = `${user.id}/${safeFileName}`;

    // ==========================
    // READ FILE
    // ==========================

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Every PDF starts with "%PDF-" within its first KB.
    if (!buffer.subarray(0, 1024).toString("latin1").includes("%PDF-")) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 415 }
      );
    }

    // ==========================
    // EXTRACT PDF TEXT
    // ==========================

    const extractedText = await extractPdfText(buffer);

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from this PDF. The PDF may be scanned/image-only.",
        },
        { status: 400 }
      );
    }

    // ==========================
    // UPLOAD PDF TO SUPABASE STORAGE
    // ==========================

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage Error:", uploadError);

      return NextResponse.json(
        { error: "Could not store the file." },
        { status: 500 }
      );
    }

    // Anything that fails after this point removes what was created so far,
    // so a failed upload never leaves a stored file or a document row with no
    // chunks behind.
    let documentId: string | null = null;

    const rollback = async () => {
      if (documentId) {
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", documentId)
          .eq("user_id", user.id);
        if (error) console.error("Upload rollback (document) failed:", error);
      }

      const { error } = await supabase.storage
        .from("documents")
        .remove([filePath]);
      if (error) console.error("Upload rollback (storage) failed:", error);
    };

    // ==========================
    // SAVE DOCUMENT METADATA
    // ==========================

    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filePath,
      })
      .select()
      .single();

    if (dbError || !document) {
      console.error("Database Error:", dbError);
      await rollback();

      return NextResponse.json(
        { error: "Could not save the document." },
        { status: 500 }
      );
    }

    documentId = document.id;

    // ==========================
    // INGEST DOCUMENT
    // ==========================

    // Ingest before linking the chat: if embedding fails (for example the
    // first-run model download), the chat is left exactly as it was.
    let ingestionResult: Awaited<ReturnType<typeof ingestDocument>>;
    try {
      ingestionResult = await withDocumentIngestionLock(document.id, () =>
        ingestDocument(
          document.id,
          user.id,
          buffer,
          extractedText
        )
      );
    } catch (ingestError) {
      console.error("Ingestion failed:", ingestError);
      await rollback();

      return NextResponse.json(
        { error: "Could not process this PDF. Please try again." },
        { status: 500 }
      );
    }

    // ==========================
    // CONNECT DOCUMENT TO CHAT
    // ==========================

    const { error: chatUpdateError } = await supabase
      .from("chats")
      .update({
        document_id: document.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)
      .eq("user_id", user.id);

    if (chatUpdateError) {
      console.error("Chat Update Error:", chatUpdateError);
      await rollback();

      return NextResponse.json(
        { error: "Document processed, but could not link it to the chat." },
        { status: 500 }
      );
    }

    // ==========================
    // FINAL RESPONSE
    // ==========================

    return NextResponse.json({
      success: true,
      chatId,
      filePath,
      documentId: document.id,
      extractedLength: extractedText.length,
      chunks: ingestionResult.chunks,
    });

  } catch (err) {
    console.error("Upload route failed:", err);

    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}