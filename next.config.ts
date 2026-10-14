import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js does not pick up a lockfile from a parent directory
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  // transformers.js loads onnxruntime and its tokenizer JSON through native
  // bindings and runtime path resolution, which breaks once webpack bundles it.
  serverExternalPackages: ["@huggingface/transformers"],
  // The embedding model cache must never be traced into a bundle. It defaults
  // to ~/.cache now, but a local EMBEDDING_CACHE_DIR can point it back here.
  outputFileTracingExcludes: {
    "*": ["./.models/**"],
  },
  // Baseline hardening headers. A strict Content-Security-Policy is left out
  // on purpose: Next.js and the Markdown/KaTeX renderers rely on inline
  // styles and scripts, so a CSP needs a nonce setup and testing first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // Legacy alias. The profile editor lives in Settings now, and a
        // config-level redirect is a real 307 — calling redirect() from a
        // page renders a meta-refresh with a one-second delay instead.
        source: "/profile",
        destination: "/dashboard/settings?tab=profile",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
