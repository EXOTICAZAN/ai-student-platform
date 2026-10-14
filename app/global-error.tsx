"use client";

import { useEffect } from "react";

// Catches failures in the root layout itself, where app/error.tsx cannot
// render. It must supply its own <html> and <body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#050816",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          EduForge AI could not load
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", maxWidth: 420, lineHeight: 1.6 }}>
          A fatal error stopped the app from rendering. Reload the page, and if
          it persists try again in a few minutes.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#6366f1",
            color: "#fff",
            border: 0,
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
