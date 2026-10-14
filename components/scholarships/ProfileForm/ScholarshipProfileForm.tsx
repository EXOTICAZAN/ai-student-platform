"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import { toast } from "sonner";
import type { StudentScholarshipProfile } from "@/lib/scholarships/types";

const COUNTRIES = [
  { code: "PK", name: "Pakistan" }, { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" }, { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" }, { code: "KE", name: "Kenya" },
  { code: "EG", name: "Egypt" }, { code: "ET", name: "Ethiopia" },
  { code: "TZ", name: "Tanzania" }, { code: "UG", name: "Uganda" },
  { code: "ZA", name: "South Africa" }, { code: "CM", name: "Cameroon" },
  { code: "ZM", name: "Zambia" }, { code: "RW", name: "Rwanda" },
  { code: "SN", name: "Senegal" }, { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" }, { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" }, { code: "MY", name: "Malaysia" },
  { code: "LK", name: "Sri Lanka" }, { code: "NP", name: "Nepal" },
  { code: "MM", name: "Myanmar" }, { code: "KH", name: "Cambodia" },
  { code: "MX", name: "Mexico" }, { code: "BR", name: "Brazil" },
  { code: "CO", name: "Colombia" }, { code: "PE", name: "Peru" },
  { code: "AR", name: "Argentina" }, { code: "TR", name: "Turkey" },
  { code: "IR", name: "Iran" }, { code: "IQ", name: "Iraq" },
  { code: "SY", name: "Syria" }, { code: "JO", name: "Jordan" },
  { code: "MA", name: "Morocco" }, { code: "TN", name: "Tunisia" },
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" }, { code: "FR", name: "France" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" },
  { code: "CN", name: "China" }, { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" }, { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" }, { code: "PL", name: "Poland" },
  { code: "RO", name: "Romania" }, { code: "XX", name: "Other" },
].sort((a, b) => a.name.localeCompare(b.name));

const FIELDS_OF_STUDY = [
  "Agriculture", "Architecture", "Arts & Design", "Biology", "Business & Management",
  "Chemistry", "Civil Engineering", "Computer Science", "Development Studies",
  "Earth Sciences", "Economics", "Education", "Electrical Engineering",
  "Environmental Studies", "Finance", "Health Sciences", "History",
  "International Relations", "Law", "Linguistics", "Mathematics",
  "Mechanical Engineering", "Media & Communications", "Medicine",
  "Natural Sciences", "Nursing", "Philosophy", "Physics", "Political Science",
  "Psychology", "Public Administration", "Public Health", "Public Policy",
  "Sociology", "Technology", "Other",
].sort();

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400">*</span>}
        {hint && (
          <span title={hint}>
            <Info className="h-3 w-3 text-slate-500 cursor-help" />
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  step,
  disabled,
}: {
  value: string | number | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white",
        "placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none",
        "focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200",
        "disabled:opacity-50",
        "[color-scheme:dark]"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white",
        "focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
        "appearance-none transition-all duration-200 disabled:opacity-50",
        "[&>option]:bg-[#0f1729] [&>option]:text-white"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Profile completeness calculation
function calcCompleteness(profile: Partial<StudentScholarshipProfile>): number {
  const fields = [
    profile.nationality, profile.date_of_birth, profile.education_level,
    profile.academic_score != null ? "ok" : null, profile.academic_score_type,
    profile.intended_degree, profile.intended_field,
    profile.english_level,
    (profile.preferred_countries?.length ?? 0) > 0 ? "ok" : null,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

interface ScholarshipProfileFormProps {
  initial: Partial<StudentScholarshipProfile> | null;
}

export default function ScholarshipProfileForm({ initial }: ScholarshipProfileFormProps) {
  const [form, setForm] = useState<Partial<StudentScholarshipProfile>>({
    nationality: "",
    nationality_name: "",
    date_of_birth: "",
    education_level: "",
    academic_score: undefined,
    academic_score_type: "",
    intended_degree: "",
    intended_field: "",
    preferred_countries: [],
    english_level: "",
    test_scores_json: {},
    graduation_year: undefined,
    ...initial,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeness = calcCompleteness(form);

  function set<K extends keyof StudentScholarshipProfile>(
    key: K,
    value: StudentScholarshipProfile[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function setTestScore(key: string, value: string) {
    const num = parseFloat(value);
    setForm((prev) => ({
      ...prev,
      test_scores_json: {
        ...(prev.test_scores_json ?? {}),
        ...(isNaN(num) ? {} : { [key]: num }),
      },
    }));
    setSaved(false);
  }

  function toggleCountry(code: string) {
    setForm((prev) => {
      const current = prev.preferred_countries ?? [];
      const updated = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code];
      return { ...prev, preferred_countries: updated };
    });
    setSaved(false);
  }

  function handleNationalityChange(code: string) {
    const name = COUNTRIES.find((c) => c.code === code)?.name ?? code;
    setForm((prev) => ({ ...prev, nationality: code, nationality_name: name }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/scholarships/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error?.message ?? "Failed to save profile");
      }

      setSaved(true);
      toast.success("Scholarship profile saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
      {/* Completeness bar */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-white">Profile Completeness</p>
          <span className={cn(
            "text-sm font-semibold",
            completeness >= 80 ? "text-emerald-400" :
            completeness >= 50 ? "text-amber-400" : "text-red-400"
          )}>
            {completeness}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/8">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              completeness >= 80 ? "bg-emerald-500" :
              completeness >= 50 ? "bg-amber-500" : "bg-indigo-500"
            )}
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {completeness < 100
            ? "Complete your profile to get accurate match scores."
            : "Great! Your profile is fully complete."}
        </p>
      </div>

      {/* Personal Info */}
      <FormSection title="Personal Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nationality" required>
            <Select
              value={form.nationality}
              onChange={handleNationalityChange}
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              placeholder="Select your nationality"
            />
          </Field>
          <Field label="Date of Birth" required>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(v) => set("date_of_birth", v)}
            />
          </Field>
        </div>
      </FormSection>

      {/* Academic Background */}
      <FormSection title="Academic Background">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current Education Level" required>
            <Select
              value={form.education_level}
              onChange={(v) => set("education_level", v)}
              options={[
                { value: "high_school", label: "High School" },
                { value: "bachelor", label: "Bachelor's Degree" },
                { value: "master", label: "Master's Degree" },
                { value: "phd", label: "PhD" },
              ]}
              placeholder="Select level"
            />
          </Field>
          <Field label="Graduation Year">
            <Input
              type="number"
              value={form.graduation_year ?? ""}
              onChange={(v) => set("graduation_year", v ? parseInt(v) : null as unknown as number)}
              placeholder="e.g. 2023"
              min="1950"
              max="2040"
            />
          </Field>
          <Field
            label="Academic Score"
            required
            hint="Enter your GPA, percentage, or equivalent score"
          >
            <Input
              type="number"
              value={form.academic_score ?? ""}
              onChange={(v) => set("academic_score", v ? parseFloat(v) : null as unknown as number)}
              placeholder="e.g. 3.8 or 85"
              step="0.01"
            />
          </Field>
          <Field label="Score Type" required>
            <Select
              value={form.academic_score_type}
              onChange={(v) => set("academic_score_type", v)}
              options={[
                { value: "gpa_4", label: "GPA (4.0 scale)" },
                { value: "gpa_5", label: "GPA (5.0 scale)" },
                { value: "gpa_10", label: "CGPA (10.0 scale)" },
                { value: "percentage", label: "Percentage (%)" },
              ]}
              placeholder="Select score type"
            />
          </Field>
        </div>
      </FormSection>

      {/* Study Goals */}
      <FormSection title="Study Goals">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Intended Degree" required>
            <Select
              value={form.intended_degree}
              onChange={(v) => set("intended_degree", v)}
              options={[
                { value: "bachelor", label: "Bachelor's" },
                { value: "master", label: "Master's" },
                { value: "phd", label: "PhD" },
              ]}
              placeholder="Select degree"
            />
          </Field>
          <Field label="Intended Field of Study" required>
            <Select
              value={form.intended_field}
              onChange={(v) => set("intended_field", v)}
              options={FIELDS_OF_STUDY.map((f) => ({ value: f, label: f }))}
              placeholder="Select your field"
            />
          </Field>
        </div>

        {/* Preferred countries */}
        <Field label="Preferred Study Countries" hint="Select up to 5 countries">
          <div className="flex flex-wrap gap-2 mt-1">
            {COUNTRIES.filter((c) => !["XX"].includes(c.code)).slice(0, 30).map((c) => {
              const selected = form.preferred_countries?.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCountry(c.code)}
                  disabled={(form.preferred_countries?.length ?? 0) >= 5 && !selected}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                    selected
                      ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </Field>
      </FormSection>

      {/* Language & Tests */}
      <FormSection title="Language & Test Scores">
        <Field label="English Proficiency Level" required>
          <Select
            value={form.english_level}
            onChange={(v) => set("english_level", v)}
            options={[
              { value: "native", label: "Native / Bilingual" },
              { value: "fluent", label: "Fluent (C2)" },
              { value: "upper_intermediate", label: "Upper Intermediate (C1/B2)" },
              { value: "intermediate", label: "Intermediate (B1)" },
              { value: "basic", label: "Basic (A2/A1)" },
              { value: "none", label: "No English" },
            ]}
            placeholder="Select level"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { key: "ielts", label: "IELTS", placeholder: "e.g. 7.5" },
            { key: "toefl", label: "TOEFL iBT", placeholder: "e.g. 100" },
            { key: "pte", label: "PTE", placeholder: "e.g. 65" },
            { key: "gre", label: "GRE", placeholder: "e.g. 320" },
            { key: "gmat", label: "GMAT", placeholder: "e.g. 650" },
            { key: "sat", label: "SAT", placeholder: "e.g. 1400" },
          ].map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                value={form.test_scores_json?.[key]}
                onChange={(v) => setTestScore(key, v)}
                placeholder={placeholder}
                step="0.5"
              />
            </Field>
          ))}
        </div>
      </FormSection>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold",
            "btn-gradient transition-all duration-200 hover:opacity-90",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </motion.div>
  );
}
