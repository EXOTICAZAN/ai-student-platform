export type AdmissionRecord = {
  id: string;
  institution: string;
  city: string;
  province: string;
  degree: string;
  field: string;
  sector: "Public" | "Private";
  deadline: string;
  tests: string[];
  eligibility: string;
  officialUrl: string;
  sourceLabel: string;
  lastVerified: string;
};

export const ADMISSIONS_REFERENCE: AdmissionRecord[] = [
  { id: "ref-nust-2025", institution: "National University of Sciences and Technology (NUST)", city: "Islamabad", province: "Islamabad Capital Territory", degree: "BS", field: "Engineering / Computing", sector: "Public", deadline: "Check official portal", tests: ["NET"], eligibility: "Review current programme prospectus and NET requirements.", officialUrl: "https://ugadmissions.nust.edu.pk/", sourceLabel: "Official NUST admissions portal", lastVerified: "Reference only — verify before applying" },
  { id: "ref-ecat-punjab", institution: "Punjab Engineering College / public engineering admissions", city: "Lahore", province: "Punjab", degree: "BS", field: "Engineering", sector: "Public", deadline: "Varies by university", tests: ["ECAT"], eligibility: "Punjab engineering admission requirements vary by institution.", officialUrl: "https://uet.edu.pk/", sourceLabel: "Official UET Lahore website", lastVerified: "Reference only — verify before applying" },
  { id: "ref-mdcat", institution: "Public medical and dental colleges (provincial process)", city: "Multiple cities", province: "National / provincial", degree: "MBBS / BDS", field: "Medicine", sector: "Public", deadline: "Varies by admitting authority", tests: ["MDCAT"], eligibility: "Check PMDC and the relevant admitting university for current criteria.", officialUrl: "https://pmdc.pk/", sourceLabel: "Official PMDC website", lastVerified: "Reference only — verify before applying" },
];

export const PROVINCES = ["All provinces", "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "National / provincial"];
export const DEGREES = ["All degrees", "BS", "MBBS / BDS", "MS / MPhil", "PhD"];
export const TESTS = ["MDCAT", "ECAT", "NET", "NTS"] as const;

export type AdmissionFilters = { province: string; city: string; degree: string; field: string; sector: string };
export function filterAdmissions(items: AdmissionRecord[], filters: AdmissionFilters): AdmissionRecord[] {
  const includes = (value: string, query: string) => !query || value.toLowerCase().includes(query.toLowerCase());
  return items.filter((item) =>
    (filters.province === "All provinces" || !filters.province || item.province === filters.province) &&
    (filters.degree === "All degrees" || !filters.degree || item.degree === filters.degree) &&
    (filters.sector === "All sectors" || !filters.sector || item.sector === filters.sector) &&
    includes(item.city, filters.city) && includes(`${item.field} ${item.institution}`, filters.field)
  );
}

export function calculateMerit(academic: number, test: number, academicWeight = 50, testWeight = 50): number {
  const a = Math.max(0, Math.min(100, academic || 0));
  const t = Math.max(0, Math.min(100, test || 0));
  return Math.round((a * academicWeight + t * testWeight) / (academicWeight + testWeight) * 100) / 100;
}

export function calculateBudget(inputs: { tuition: number; hostel: number; transport: number; books: number; internet: number; applications: number; months: number }) {
  const monthly = Math.max(0, inputs.tuition) + Math.max(0, inputs.hostel) + Math.max(0, inputs.transport) + Math.max(0, inputs.books) + Math.max(0, inputs.internet);
  const annual = monthly * Math.max(1, inputs.months) + Math.max(0, inputs.applications);
  return { monthly, annual };
}

export const OFFICIAL_LINKS = [
  ["PMDC (medical regulation)", "https://pmdc.pk/"],
  ["HEC Pakistan", "https://hec.gov.pk/"],
  ["IBCC Pakistan", "https://ibcc.edu.pk/"],
  ["NTS", "https://www.nts.org.pk/"],
  ["NAVTTC", "https://navttc.gov.pk/"],
] as const;
