import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  statusFilterClause,
  withEffectiveStatus,
} from "@/lib/scholarships/status";

const NOW = new Date("2026-10-11T00:00:00.000Z");

describe("effectiveStatus", () => {
  it("closes an open scholarship whose deadline has passed", () => {
    expect(effectiveStatus("open", "2026-05-31T23:59:00Z", NOW)).toBe("closed");
  });

  it("closes an upcoming scholarship whose deadline has passed", () => {
    expect(effectiveStatus("upcoming", "2026-01-01T00:00:00Z", NOW)).toBe("closed");
  });

  it("leaves future deadlines and missing deadlines alone", () => {
    expect(effectiveStatus("open", "2027-01-01T00:00:00Z", NOW)).toBe("open");
    expect(effectiveStatus("open", null, NOW)).toBe("open");
    expect(effectiveStatus("unknown", null, NOW)).toBe("unknown");
  });

  it("never reopens a stored-closed scholarship", () => {
    expect(effectiveStatus("closed", "2027-01-01T00:00:00Z", NOW)).toBe("closed");
  });

  it("ignores unparseable deadlines", () => {
    expect(effectiveStatus("open", "soon", NOW)).toBe("open");
  });
});

describe("withEffectiveStatus", () => {
  it("returns a copy with the derived status", () => {
    const row = { id: "1", status: "open", application_deadline: "2025-01-01T00:00:00Z" };
    const out = withEffectiveStatus(row, NOW);
    expect(out.status).toBe("closed");
    expect(row.status).toBe("open");
  });
});

describe("statusFilterClause", () => {
  it("open excludes passed deadlines", () => {
    const c = statusFilterClause("open", NOW);
    expect(c.eq).toBe("open");
    expect(c.or).toContain("application_deadline.is.null");
    expect(c.or).toContain("application_deadline.gte.2026-10-11");
  });

  it("closed includes stored-closed and passed deadlines", () => {
    const c = statusFilterClause("closed", NOW);
    expect(c.eq).toBeUndefined();
    expect(c.or).toContain("status.eq.closed");
    expect(c.or).toContain("application_deadline.lt.2026-10-11");
  });
});
