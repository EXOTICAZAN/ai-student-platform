import { describe, expect, it } from "vitest";
import { matchScholarship } from "@/lib/scholarships/matching";
import type {
  RequirementRow,
  ScholarshipDetail,
  StudentScholarshipProfile,
} from "@/lib/scholarships/types";

const profile: StudentScholarshipProfile = {
  nationality: "pk",
  nationality_name: "Pakistan",
  date_of_birth: "2008-01-01",
  education_level: "high_school",
  academic_score: 95,
  academic_score_type: "percentage",
  intended_degree: "bachelor",
  intended_field: "Robotics",
  preferred_countries: [],
  english_level: "",
  test_scores_json: {},
  graduation_year: 2027,
  extra_profile_json: {},
};

let n = 0;
function req(
  requirement_type: RequirementRow["requirement_type"],
  operator: string,
  value: unknown,
  required = true
): RequirementRow {
  return {
    id: `r${n++}`,
    scholarship_id: "s",
    requirement_type,
    operator,
    value_json: value,
    description: `${requirement_type} ${operator}`,
    required,
    source_reference: null,
    created_at: "",
    updated_at: "",
  };
}

function scholarship(requirements: RequirementRow[]): ScholarshipDetail {
  return { id: "s", name: "Test", requirements, documents: [], sources: [] } as unknown as ScholarshipDetail;
}

describe("matchScholarship", () => {
  it("has no score when a scholarship lists no requirements", () => {
    const m = matchScholarship(scholarship([]), profile);
    expect(m.score).toBe(0);
    expect(m.category).toBe("no_profile");
  });

  it("is not eligible, with score 0, when a mandatory requirement fails", () => {
    const m = matchScholarship(
      scholarship([req("nationality", "in", ["us", "gb"]), req("degree", "in", ["bachelor"])]),
      profile
    );
    expect(m.category).toBe("not_eligible");
    expect(m.score).toBe(0);
    expect(m.failed_mandatory).toHaveLength(1);
  });

  it("passes a matching nationality", () => {
    const m = matchScholarship(scholarship([req("nationality", "in", ["pk"])]), profile);
    expect(m.strong_matches).toHaveLength(1);
    expect(m.score).toBe(100);
  });

  it("never treats unknown data as a pass", () => {
    const m = matchScholarship(
      scholarship([req("nationality", "in", ["pk"])]),
      { ...profile, nationality: "" }
    );
    expect(m.missing_info).toHaveLength(1);
    expect(m.strong_matches).toHaveLength(0);
    expect(m.score).toBe(0);
  });

  it("a failed optional requirement lowers the score without disqualifying", () => {
    const m = matchScholarship(
      scholarship([req("nationality", "in", ["pk"]), req("degree", "in", ["phd"], false)]),
      profile
    );
    expect(m.category).not.toBe("not_eligible");
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThan(100);
  });
});
