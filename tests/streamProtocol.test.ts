import { describe, expect, it } from "vitest";
import { STREAM_ERROR_PREFIX } from "@/lib/ai/stream-protocol";

describe("tutor stream protocol", () => {
  it("uses a non-displayable terminal marker for post-header failures", () => {
    expect(STREAM_ERROR_PREFIX).toContain("EDUFORGE_STREAM_ERROR:");
    expect(STREAM_ERROR_PREFIX).toMatch(/^\u0000/);
  });
});
