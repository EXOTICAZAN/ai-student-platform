/**
 * EduForge AI — Scholarship Matching Engine
 *
 * Deterministic. No AI involved here.
 * Each structured requirement is evaluated against the student's profile.
 * UNKNOWN data is never treated as a PASS.
 * A score is a prioritization aid, not a guarantee of eligibility.
 */

import type {
  ScholarshipDetail,
  StudentScholarshipProfile,
  RequirementRow,
  RequirementResult,
  RequirementEval,
  MatchResult,
  MatchCategory,
} from "./types";

// ------------------------------------------------------------------
// Weight configuration (configurable, not hard-coded in UI)
// ------------------------------------------------------------------

const WEIGHTS: Record<string, number> = {
  nationality: 0.20,
  degree: 0.20,
  academic_score: 0.20,
  field: 0.15,
  age: 0.10,
  language: 0.05,
  test: 0.05,
  residency: 0.03,
  graduation_year: 0.02,
};

const DEFAULT_WEIGHT = 0.01;

// ------------------------------------------------------------------
// Individual requirement evaluation
// ------------------------------------------------------------------

function evaluateRequirement(
  req: RequirementRow,
  profile: StudentScholarshipProfile
): RequirementResult {
  const base: Omit<RequirementResult, "eval" | "reason"> = {
    requirement_id: req.id,
    requirement_type: req.requirement_type,
    description: req.description,
    required: req.required,
  };

  try {
    const result = evaluate(req, profile);
    return { ...base, ...result };
  } catch {
    return {
      ...base,
      eval: "UNKNOWN",
      reason: "Could not evaluate this requirement. Check the official source.",
    };
  }
}

function evaluate(
  req: RequirementRow,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  const value = req.value_json as Record<string, unknown>;

  switch (req.requirement_type) {
    case "nationality":
      return evalNationality(req.operator, value, profile);

    case "age":
      return evalAge(req.operator, value, profile);

    case "degree":
      return evalDegree(req.operator, value, profile);

    case "academic_score":
      return evalAcademicScore(req.operator, value, profile);

    case "field":
      return evalField(req.operator, value, profile);

    case "language":
      return evalLanguage(req.operator, value, profile);

    case "test":
      return evalTest(req.operator, value, profile);

    case "residency":
      return evalResidency(req.operator, value);

    case "graduation_year":
      return evalGraduationYear(req.operator, value, profile);

    default:
      return {
        eval: "REVIEW",
        reason: "This requirement type requires manual review on the official site.",
      };
  }
}

// ------------------------------------------------------------------
// Per-type evaluators
// ------------------------------------------------------------------

function evalNationality(
  operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  if (!profile.nationality) {
    return { eval: "UNKNOWN", reason: "Your nationality is not set in your profile." };
  }

  const nat = profile.nationality.toLowerCase();

  if (operator === "eq") {
    const expected = String(value).toLowerCase();
    const pass = nat === expected;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your nationality (${profile.nationality_name}) matches.`
        : `Your nationality does not match the required nationality.`,
    };
  }

  if (operator === "in") {
    const list = (value as unknown as string[]).map((v) => v.toLowerCase());
    // Special keyword groups
    const hasNonUK = list.includes("non_uk");
    const hasCommonwealth = list.includes("commonwealth_developing");
    const hasAUPartner = list.includes("au_partner_countries");

    if (hasNonUK) {
      const pass = nat !== "gb";
      return {
        eval: pass ? "PASS" : "FAIL",
        reason: pass
          ? "Open to non-UK nationals — you qualify."
          : "This scholarship is not available to UK nationals.",
      };
    }
    if (hasCommonwealth) {
      return {
        eval: "REVIEW",
        reason:
          "Eligibility is limited to citizens of developing Commonwealth countries. Please verify your country's inclusion on the official site.",
      };
    }
    if (hasAUPartner) {
      return {
        eval: "REVIEW",
        reason:
          "Eligibility is limited to citizens of Australia Awards partner countries. Please verify your country's inclusion on the official site.",
      };
    }
    const pass = list.includes(nat);
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your nationality is on the eligible list.`
        : `Your nationality is not on the eligible list for this scholarship.`,
    };
  }

  if (operator === "not_in") {
    const list = (value as unknown as string[]).map((v) => v.toLowerCase());
    const fail = list.includes(nat);
    return {
      eval: fail ? "FAIL" : "PASS",
      reason: fail
        ? `Citizens of ${profile.nationality_name} are not eligible for this scholarship.`
        : "Your nationality is not excluded.",
    };
  }

  return { eval: "REVIEW", reason: "Nationality eligibility requires manual review." };
}

function evalAge(
  operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  if (!profile.date_of_birth) {
    return { eval: "UNKNOWN", reason: "Your date of birth is not set in your profile." };
  }

  const today = new Date();
  const dob = new Date(profile.date_of_birth);
  const age = today.getFullYear() - dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

  if (operator === "lte") {
    const limit = Number(value.value);
    const note = value.note ? ` (${value.note})` : "";
    const pass = age <= limit;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your age (${age}) is within the limit of ${limit}.${note}`
        : `Your age (${age}) exceeds the maximum age of ${limit}.${note}`,
    };
  }

  if (operator === "gte") {
    const limit = Number(value.value);
    const pass = age >= limit;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your age (${age}) meets the minimum requirement.`
        : `Your age (${age}) is below the minimum of ${limit}.`,
    };
  }

  if (operator === "range") {
    const min = Number(value.min);
    const max = Number(value.max);
    const note = value.note ? ` (${value.note})` : "";
    const pass = age >= min && age <= max;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your age (${age}) is within the required range of ${min}–${max}.${note}`
        : `Your age (${age}) is outside the required range of ${min}–${max}.${note}`,
    };
  }

  return { eval: "REVIEW", reason: "Age requirement requires manual verification." };
}

function evalDegree(
  operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  // Check intended_degree (what they want to study) and education_level (what they have)
  const intended = profile.intended_degree?.toLowerCase();
  const education = profile.education_level?.toLowerCase();

  const degreeMap: Record<string, string[]> = {
    bachelor: ["bachelor", "undergraduate"],
    master: ["master", "masters", "postgraduate"],
    phd: ["phd", "doctoral", "doctorate"],
  };

  if (operator === "eq") {
    const required = String(value).toLowerCase();
    const aliases = degreeMap[required] ?? [required];

    // For "bachelor" requirement: check they have a high school diploma + want bachelor
    // For "master"/"phd": check they have at least a bachelor
    if (required === "bachelor") {
      if (!intended) {
        return { eval: "UNKNOWN", reason: "Set your intended degree in your profile." };
      }
      const pass = aliases.some((a) => intended.includes(a));
      return {
        eval: pass ? "PASS" : "FAIL",
        reason: pass
          ? "Your intended degree matches."
          : "This scholarship is for bachelor's level, but your intended degree is different.",
      };
    }

    // master/phd: need a bachelor's at minimum
    if (required === "master" || required === "phd") {
      if (!education && !intended) {
        return {
          eval: "UNKNOWN",
          reason: "Set your education level and intended degree in your profile.",
        };
      }
      // Check education level (what they have)
      const hasRequiredBase =
        education?.includes("bachelor") ||
        education?.includes("master") ||
        education?.includes("phd");

      if (!hasRequiredBase) {
        return {
          eval: education ? "FAIL" : "UNKNOWN",
          reason: education
            ? "A bachelor's degree is required to apply for this scholarship."
            : "Set your current education level in your profile.",
        };
      }

      // Check if intended degree matches
      if (!intended) {
        return { eval: "UNKNOWN", reason: "Set your intended degree in your profile." };
      }
      const pass = aliases.some((a) => intended.includes(a));
      return {
        eval: pass ? "PASS" : "FAIL",
        reason: pass
          ? "Your intended degree matches."
          : `This scholarship is for ${required} level, but your intended degree is different.`,
      };
    }
  }

  if (operator === "in") {
    const requiredLevels = (value as unknown as string[]).map((v) => v.toLowerCase());
    if (!intended) {
      return { eval: "UNKNOWN", reason: "Set your intended degree in your profile." };
    }
    const pass = requiredLevels.some((r) => {
      const aliases = degreeMap[r] ?? [r];
      return aliases.some((a) => intended.includes(a));
    });
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? "Your intended degree is among the eligible levels."
        : `This scholarship is for ${requiredLevels.join(", ")} — your intended degree differs.`,
    };
  }

  return { eval: "REVIEW", reason: "Degree eligibility requires manual review." };
}

function evalAcademicScore(
  operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  if (profile.academic_score === null || profile.academic_score === undefined) {
    return { eval: "UNKNOWN", reason: "Your academic score is not set in your profile." };
  }

  const profileScale = profile.academic_score_type?.toLowerCase() ?? "";
  const reqScale = String(value.scale ?? "").toLowerCase();
  const threshold = Number(value.value);
  const note = value.note ? ` ${value.note}` : "";

  // If scales differ, we can only give a REVIEW
  if (reqScale && profileScale && !scalesCompatible(profileScale, reqScale)) {
    return {
      eval: "REVIEW",
      reason: `Your score is on a ${profile.academic_score_type} scale; this requirement uses ${value.scale}. Please verify on the official site.${note}`,
    };
  }

  if (operator === "gte") {
    const pass = profile.academic_score >= threshold;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your score (${profile.academic_score}) meets the minimum (${threshold}).${note}`
        : `Your score (${profile.academic_score}) is below the minimum (${threshold}).${note}`,
    };
  }

  if (operator === "lte") {
    const pass = profile.academic_score <= threshold;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your score meets the maximum requirement.${note}`
        : `Your score exceeds the maximum allowed.${note}`,
    };
  }

  return { eval: "REVIEW", reason: `Academic score requires manual verification.${note}` };
}

function scalesCompatible(a: string, b: string): boolean {
  // Allow same or clearly equivalent scales
  if (a === b) return true;
  if (a.includes("percentage") && b.includes("percentage")) return true;
  if (a.includes("gpa") && b.includes("gpa")) return true;
  return false;
}

function evalField(
  _operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  if (!profile.intended_field) {
    return { eval: "UNKNOWN", reason: "Your intended field of study is not set in your profile." };
  }

  const profileField = profile.intended_field.toLowerCase();

  // Special case: "Any field" means all pass
  const values = value as unknown as string[];
  if (
    values.some((v) => v.toLowerCase().includes("any field"))
  ) {
    return { eval: "PASS", reason: "This scholarship is open to all fields of study." };
  }

  const match = values.some((v) =>
    v.toLowerCase().includes(profileField) ||
    profileField.includes(v.toLowerCase())
  );

  return {
    eval: match ? "PASS" : "REVIEW",
    reason: match
      ? `Your intended field (${profile.intended_field}) is in the eligible list.`
      : `Your intended field (${profile.intended_field}) may not be in the priority list. Check the official source for the full list.`,
  };
}

function evalLanguage(
  _operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  const required = (value as unknown as string).toLowerCase();

  if (required === "english") {
    const level = profile.english_level?.toLowerCase();
    const hasTest = profile.test_scores_json &&
      (profile.test_scores_json.ielts || profile.test_scores_json.toefl || profile.test_scores_json.pte);

    if (!level && !hasTest) {
      return {
        eval: "UNKNOWN",
        reason: "Set your English level or test scores in your profile to evaluate language requirements.",
      };
    }

    const nativeLevels = ["native", "fluent", "c1", "c2", "upper_intermediate"];
    if (level && nativeLevels.some((l) => level.includes(l))) {
      return { eval: "PASS", reason: "Your English level meets the requirement." };
    }
    if (hasTest) {
      return { eval: "PASS", reason: "You have English test scores on file." };
    }
    return {
      eval: "REVIEW",
      reason: "English language proficiency required. Add your IELTS/TOEFL scores or level.",
    };
  }

  if (required === "german") {
    const germanScore = profile.test_scores_json?.goethe || profile.test_scores_json?.testdaf;
    if (germanScore) {
      return { eval: "PASS", reason: "You have a German language qualification on file." };
    }
    return {
      eval: "UNKNOWN",
      reason: "German language proficiency may be required. Add your language qualification.",
    };
  }

  return {
    eval: "REVIEW",
    reason: `Language requirement (${required}) needs manual verification.`,
  };
}

function evalTest(
  _operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  const testName = String(value.name ?? value).toLowerCase();
  const scores = profile.test_scores_json ?? {};
  const score = scores[testName];

  if (score === undefined) {
    return {
      eval: "UNKNOWN",
      reason: `${testName.toUpperCase()} score not found in your profile. Add it if you have taken this test.`,
    };
  }

  const minScore = Number(value.min_score ?? value.value ?? 0);
  if (minScore && score < minScore) {
    return {
      eval: "FAIL",
      reason: `Your ${testName.toUpperCase()} score (${score}) is below the minimum (${minScore}).`,
    };
  }

  return {
    eval: "PASS",
    reason: `Your ${testName.toUpperCase()} score (${score}) meets the requirement.`,
  };
}

function evalResidency(
  _operator: string,
  value: Record<string, unknown>
): { eval: RequirementEval; reason: string } {
  const condition = String(value).toLowerCase();

  if (condition.includes("return_to_home") || condition.includes("return")) {
    return {
      eval: "REVIEW",
      reason:
        "This scholarship requires you to return to your home country after completion. Please verify this commitment on the official site.",
    };
  }

  if (condition.includes("outside_australia")) {
    return {
      eval: "REVIEW",
      reason:
        "You must not be living or studying in Australia to be eligible. Verify on the official site.",
    };
  }

  return { eval: "REVIEW", reason: "Residency requirement requires manual verification." };
}

function evalGraduationYear(
  operator: string,
  value: Record<string, unknown>,
  profile: StudentScholarshipProfile
): { eval: RequirementEval; reason: string } {
  if (!profile.graduation_year) {
    return { eval: "UNKNOWN", reason: "Your graduation year is not set in your profile." };
  }

  const note = value.note ? ` (${value.note})` : "";

  if (operator === "gte") {
    const yearsAgo = Number(value.value);
    const currentYear = new Date().getFullYear();
    const earliestAllowed = currentYear - yearsAgo;
    const pass = profile.graduation_year >= earliestAllowed;
    return {
      eval: pass ? "PASS" : "FAIL",
      reason: pass
        ? `Your graduation year (${profile.graduation_year}) is within the recency requirement.${note}`
        : `Your graduation year (${profile.graduation_year}) may be too far in the past.${note}`,
    };
  }

  return { eval: "REVIEW", reason: `Graduation year requirement needs verification.${note}` };
}

// ------------------------------------------------------------------
// Aggregate matching
// ------------------------------------------------------------------

export function matchScholarship(
  scholarship: ScholarshipDetail,
  profile: StudentScholarshipProfile
): MatchResult {
  const requirements = scholarship.requirements ?? [];

  if (requirements.length === 0) {
    return {
      score: 0,
      category: "no_profile",
      requirement_results: [],
      strong_matches: [],
      potential_issues: [],
      missing_info: [],
      failed_mandatory: [],
    };
  }

  const results: RequirementResult[] = requirements.map((req) =>
    evaluateRequirement(req, profile)
  );

  // Classify results
  const strong_matches = results.filter((r) => r.eval === "PASS");
  const failed_mandatory = results.filter(
    (r) => r.eval === "FAIL" && r.required
  );
  const potential_issues = results.filter(
    (r) =>
      (r.eval === "FAIL" && !r.required) ||
      r.eval === "REVIEW"
  );
  const missing_info = results.filter((r) => r.eval === "UNKNOWN");

  // Deterministic category
  let category: MatchCategory;

  if (failed_mandatory.length > 0) {
    category = "not_eligible";
  } else {
    const score = computeScore(results);
    if (score >= 70 && missing_info.length === 0 && potential_issues.length === 0) {
      category = "strong_match";
    } else if (score >= 40) {
      category = "possible_match";
    } else {
      category = "low_match";
    }
  }

  const score =
    category === "not_eligible" ? 0 : computeScore(results);

  return {
    score,
    category,
    requirement_results: results,
    strong_matches,
    potential_issues,
    missing_info,
    failed_mandatory,
  };
}

function computeScore(results: RequirementResult[]): number {
  let totalWeight = 0;
  let earnedWeight = 0;

  for (const r of results) {
    const weight = WEIGHTS[r.requirement_type] ?? DEFAULT_WEIGHT;
    totalWeight += weight;

    if (r.eval === "PASS") {
      earnedWeight += weight;
    } else if (r.eval === "REVIEW") {
      earnedWeight += weight * 0.5; // partial credit for REVIEW
    }
    // FAIL and UNKNOWN earn 0
  }

  if (totalWeight === 0) return 0;
  return Math.round((earnedWeight / totalWeight) * 100);
}

// ------------------------------------------------------------------
// Match all scholarships for a profile
// ------------------------------------------------------------------

export function matchAll(
  scholarships: ScholarshipDetail[],
  profile: StudentScholarshipProfile
): Array<{ scholarship: ScholarshipDetail; match: MatchResult }> {
  return scholarships
    .map((s) => ({ scholarship: s, match: matchScholarship(s, profile) }))
    .sort((a, b) => b.match.score - a.match.score);
}
