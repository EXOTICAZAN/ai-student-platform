import PDFParser from "pdf2json";

interface TextItem {
  R?: Array<{
    T?: string;
  }>;
}

interface PdfPage {
  Texts?: TextItem[];
}

interface PdfData {
  Pages: PdfPage[];
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (error: unknown) => {
      if (error && typeof error === "object") {
        reject((error as { parserError?: string }).parserError || error);
      } else {
        reject(error);
      }
    });

    parser.on("pdfParser_dataReady", (pdfData: PdfData) => {
      try {
        const text = pdfData.Pages
          .map((page: PdfPage) =>
            (page.Texts || [])
              .map((item: TextItem) => {
                try {
                  return decodeURIComponent(item.R?.[0]?.T || "");
                } catch {
                  return item.R?.[0]?.T || "";
                }
              })
              .join(" ")
          )
          .join("\n");

        resolve(text);
      } catch (error) {
        reject(error);
      }
    });

    parser.parseBuffer(buffer);
  });
}