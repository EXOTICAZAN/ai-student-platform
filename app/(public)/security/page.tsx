import type { Metadata } from "next";
import {
  Bug,
  Database,
  KeyRound,
  Lock,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";

export const metadata: Metadata = {
  title: "Security — EduForge AI",
  description:
    "How EduForge AI protects your data, how AI processing works, and how to report a vulnerability.",
};

const CONTROLS = [
  {
    icon: Database,
    title: "Row Level Security on every table",
    body: "Postgres RLS is enabled on all tables holding user data, with policies that restrict reads and writes to rows whose user id matches the authenticated session. A user cannot read another user's notes, cards, quizzes, tasks or documents even by constructing a request for them directly.",
  },
  {
    icon: Lock,
    title: "Defence in depth in application code",
    body: "RLS is not the only layer. Server-side queries additionally filter by user id explicitly, and every insert carries the authenticated user's id. Ownership is verified before an action runs, rather than trusting an identifier supplied by the client.",
  },
  {
    icon: KeyRound,
    title: "Credentials never reach the browser",
    body: "The AI provider key and all server secrets live in server-side environment variables and are used only inside route handlers and server actions. The browser receives only the publishable Supabase key, which is gated by RLS. Secrets are not committed to the repository.",
  },
  {
    icon: Server,
    title: "Authentication handled by a specialist",
    body: "Sign-in, session issuance and password hashing are delegated to Supabase Auth. We never see or store your password in plain text, and we do not implement our own cryptographic primitives.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted in transit",
    body: "All traffic between your browser, the application, the database and the AI provider is served over TLS. Uploaded files are stored in a path namespaced by your user id.",
  },
  {
    icon: Sparkles,
    title: "Scoped AI processing",
    body: "Generation requests send only the content the feature needs — your message and conversation history for the tutor, the relevant retrieved chunks for document questions, the specific note for flashcards and quizzes. Long inputs are truncated before transmission. We do not train models on your content.",
  },
];

const DISCLOSURE = [
  "Email azanalikhadim02@gmail.com with a description of the issue and steps to reproduce it.",
  "Give us a reasonable window to investigate and fix before any public disclosure. We aim to acknowledge within two business days.",
  "Test only against accounts you own. Do not access, modify or delete other users' data, and do not run denial-of-service or social engineering attacks against the service.",
  "Include the affected URL or endpoint, what you expected versus what happened, and whether you believe the issue is currently exploitable.",
  "If you found a data exposure, tell us whose data and roughly how much, so we can assess notification obligations.",
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="How we protect"
        titleAccent="your study data"
        description="The controls that are actually in place, stated plainly — including the things we have not done yet."
      />

      <div className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <div className="mb-12 flex gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm leading-relaxed text-slate-300">
              <p className="font-semibold text-white">Honest scope statement</p>
              <p className="mt-2">
                EduForge AI is an early-stage project. The controls below are real and in
                production, but we have <strong>not</strong> completed an independent penetration
                test, we hold <strong>no</strong> security certification such as SOC 2 or ISO 27001,
                and we have no formal bug bounty programme. If your institution requires an assured
                vendor before you can adopt a tool, we are not there yet and we would rather you
                knew that now.
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Controls in place
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {CONTROLS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-indigo-500/30"
              >
                <Icon className="h-5 w-5 text-indigo-400" />
                <p className="mt-3 font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.05} className="mt-14">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <Bug className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Reporting a vulnerability
              </h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
              We welcome security research and will not pursue anyone who reports a genuine issue in
              good faith and follows the guidance below.
            </p>
            <ol className="mt-5 ml-5 list-decimal space-y-2.5 text-sm leading-relaxed text-slate-300">
              {DISCLOSURE.map((item) => (
                <li key={item.slice(0, 40)}>{item}</li>
              ))}
            </ol>
            <a
              href="mailto:azanalikhadim02@gmail.com?subject=Security%20disclosure%20%E2%80%94%20EduForge%20AI"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-sm font-medium text-indigo-200 transition-colors hover:border-indigo-500/60 hover:bg-indigo-500/20 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              azanalikhadim02@gmail.com
            </a>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-10">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              What we are working on
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-400">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                An automated export so you can take a full copy of your data without emailing us.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                Rate limiting on AI endpoints beyond the current in-memory limiter, so abuse is harder and cost is predictable.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                Audit logging for administrative and data-deletion operations.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                An independent security review once the product stabilises.
              </li>
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Detail on what data we hold and how AI providers are involved is in the{" "}
              <a
                href="/privacy"
                className="font-medium text-indigo-300 underline transition-colors hover:text-white"
              >
                privacy policy
              </a>
              .
            </p>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}
