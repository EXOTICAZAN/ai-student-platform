import type { Metadata } from "next";
import { Sprout } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import RoleAccordion, { type Role } from "@/components/public/RoleAccordion";

export const metadata: Metadata = {
  title: "Careers — EduForge AI",
  description:
    "Open roles at EduForge AI. We are an early-stage project building AI study tools for students.",
};

const roles: Role[] = [
  {
    title: "Full-Stack Engineer (Next.js / Supabase)",
    team: "Engineering",
    location: "Remote",
    type: "Contract",
    summary:
      "Own features end to end across the Next.js app router, Supabase Postgres and the Groq integration — from schema and row level security through to the animated UI.",
    responsibilities: [
      "Ship full features: database schema and RLS policies, server actions, API routes, and the React client that consumes them.",
      "Extend the AI layer — prompt design, structured JSON output, streaming, and retrieval over uploaded documents.",
      "Keep the design system coherent as new pages land, working in Tailwind and framer-motion.",
      "Write migrations that are safe to run against a live database, and verify your work in a real browser before calling it done.",
    ],
    requirements: [
      "Production experience with the Next.js app router, server components and server actions.",
      "Comfortable designing Postgres schemas and reasoning about row level security.",
      "Strong TypeScript — you would rather model a domain properly than reach for any.",
      "Have integrated at least one LLM API and dealt with the messy parts: malformed output, streaming, rate limits and cost.",
      "Product sense about what students actually need, rather than what is impressive to build.",
    ],
  },
  {
    title: "Machine Learning Engineer (RAG & Evaluation)",
    team: "AI",
    location: "Remote",
    type: "Contract",
    summary:
      "Improve retrieval quality over student documents and build the evaluation harness that tells us whether a prompt change actually helped.",
    responsibilities: [
      "Improve chunking, embedding and retrieval quality for lecture PDFs and pasted notes.",
      "Design structured generation so quizzes and flashcards come back valid and pedagogically sound, first time.",
      "Build an evaluation set of real study material and measure answer quality, hallucination rate and cost per request.",
      "Reduce latency and token spend without making outputs worse.",
    ],
    requirements: [
      "Hands-on experience with retrieval-augmented generation, including vector search in Postgres or similar.",
      "Familiar with embedding models and the trade-offs in dimensionality, chunk size and overlap.",
      "You have built evaluation pipelines before and can explain why offline metrics disagreed with user experience.",
      "Python or TypeScript; our stack is TypeScript end to end.",
    ],
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote",
    type: "Part-time",
    summary:
      "Design the study surfaces — the flip-card review session, the quiz flow, the planner board — where small interaction details decide whether a student keeps coming back.",
    responsibilities: [
      "Design flows for spaced-repetition review, quiz taking and study planning, then prototype them.",
      "Extend the existing dark glassmorphism system rather than replacing it.",
      "Sit with students, watch them revise, and turn what you see into concrete changes.",
      "Hand off specs an engineer can build without a translation layer.",
    ],
    requirements: [
      "Portfolio showing interaction design for a product people use repeatedly, not just marketing pages.",
      "Comfortable designing motion and micro-interactions, and specifying them precisely.",
      "Can work directly in Tailwind classes or a similar token system.",
      "Genuine interest in how people learn.",
    ],
  },
  {
    title: "Scholarship Data Researcher",
    team: "Data",
    location: "Remote",
    type: "Part-time",
    summary:
      "Find, verify and structure scholarship opportunities so the matching engine has accurate eligibility rules to work against.",
    responsibilities: [
      "Research fully funded scholarships from official sources and record every eligibility requirement in structured form.",
      "Verify deadlines and keep records current, flagging anything that has gone stale.",
      "Turn prose requirements into the structured rules the matching engine evaluates.",
      "Keep an audit trail: every record carries its official source URL and a verification note.",
    ],
    requirements: [
      "Meticulous about sources — you would rather mark something unknown than guess.",
      "Comfortable reading eligibility criteria across different education systems and grading scales.",
      "Strong written English; another language is a real advantage.",
      "Some familiarity with spreadsheets or SQL.",
    ],
  },
  {
    title: "Student Ambassador",
    team: "Community",
    location: "Remote",
    type: "Volunteer",
    summary:
      "Use EduForge AI for your own revision, tell us honestly where it fails, and help other students at your institution get started.",
    responsibilities: [
      "Use the product for real coursework and report what broke or confused you.",
      "Run or help with a session at your university showing students how to study with it.",
      "Gather feedback from other students and bring it back to us unfiltered.",
    ],
    requirements: [
      "Currently enrolled at a university or college.",
      "Happy to give blunt feedback rather than polite feedback.",
      "Some experience presenting or organising student events is a plus, not a requirement.",
    ],
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Build the tools"
        titleAccent="you wish you had"
        description="EduForge AI is an early-stage project, not a large company. There is no HR process and no team of fifty — you would be working directly on the product students use every day."
      />

      <div className="mx-auto max-w-4xl px-6 pb-24 lg:px-8">
        <AnimatedSection>
          <div className="mb-12 flex gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
            <Sprout className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm leading-relaxed text-slate-300">
              <p className="font-semibold text-white">An honest note before you apply</p>
              <p className="mt-2">
                We are a small, early-stage project. The roles below are contract, part-time or
                volunteer rather than salaried permanent positions, and we would rather say that
                upfront than discover it in a third interview. What we can offer is real ownership:
                the features you build go straight in front of students, and your judgement shapes
                the product.
              </p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Open roles — {roles.length}
          </h2>
          <div className="mt-5">
            <RoleAccordion roles={roles} />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="mt-14">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white">
              Do not see your role?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              We are more interested in what you have built than in matching a job description. If
              you have made something that helps people learn — an app, a study system, a
              well-loved course note repository — send it over. Applying opens your email app with a
              prefilled message to azanalikhadim02@gmail.com.
            </p>
            <a
              href="mailto:azanalikhadim02@gmail.com?subject=Spontaneous%20application%20%E2%80%94%20EduForge%20AI"
              className="btn-gradient mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110"
            >
              Send a spontaneous application
            </a>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
}
