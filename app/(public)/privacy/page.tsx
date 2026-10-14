import type { Metadata } from "next";
import LegalLayout, { type LegalSection } from "@/components/public/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — EduForge AI",
  description:
    "How EduForge AI collects, processes and stores your data, including what is sent to AI providers.",
};

const UPDATED = "1 October 2026";

const sections: LegalSection[] = [
  {
    id: "summary",
    heading: "The short version",
    blocks: [
      {
        type: "note",
        text: "We store what you give us: your account details, your study material, and records of what you did in the app. When you ask for AI generation, the relevant content is sent to Groq's inference API to produce the result. Every database table is locked to your own user id, so other users cannot read your data. You can delete all of it yourself from Settings.",
      },
      {
        type: "p",
        text: "EduForge AI is an early-stage project. We do not sell data, we do not run advertising, and we do not have a data broker relationship with anyone. The rest of this policy explains the detail.",
      },
    ],
  },
  {
    id: "what-we-collect",
    heading: "What we collect",
    blocks: [
      {
        type: "p",
        text: "We collect only what the product needs to function, and almost all of it is content you deliberately created.",
      },
      {
        type: "ul",
        items: [
          "Account data — your email address, a password hash held by our authentication provider, your display name, and the timestamp your account was created.",
          "Profile data you choose to enter — country, grade or level, learning goal, target degree, preferred language, and an optional avatar URL.",
          "Scholarship profile data you choose to enter — nationality, date of birth, education level, academic scores and their scale, intended degree and field, preferred countries, English level, standardised test scores, and graduation year. This is used solely to evaluate eligibility rules.",
          "Study content you create — notes and their markdown bodies, flashcard decks and cards, generated quizzes with questions and your attempts, and study planner tasks.",
          "Documents you upload — PDF files you attach to an AI tutor chat, stored as files alongside extracted text split into chunks for retrieval.",
          "Usage records — a log of actions you take in the app (created a note, completed a quiz, finished a task) with a timestamp, an experience-point value, and small metadata such as the subject or duration. This powers streaks, levels and the analytics page.",
          "Preferences — your daily study goal in minutes.",
        ],
      },
      {
        type: "p",
        text: "We do not require your real name, your institution, your student ID, your address, or your date of birth. The date of birth field in the scholarship profile exists because some scholarships impose age limits; it is optional and you can leave it blank at the cost of those particular matches being marked unknown.",
      },
    ],
  },
  {
    id: "why",
    heading: "Why we process it",
    blocks: [
      {
        type: "p",
        text: "Each category exists for a specific function. We do not process data for purposes beyond these.",
      },
      {
        type: "ul",
        items: [
          "To authenticate you and keep your session alive.",
          "To store and return your notes, decks, quizzes and tasks across your devices.",
          "To generate study material with AI from the topics, text or documents you supply.",
          "To answer questions grounded in a document you uploaded, by retrieving the most relevant chunks of that document.",
          "To evaluate scholarship eligibility rules against your scholarship profile and produce a match score.",
          "To compute your streak, level, experience points and the charts on your analytics page.",
          "To let you delete your own data.",
        ],
      },
      {
        type: "p",
        text: "Our legal basis is your consent, given by creating an account and entering content, plus necessity for performing the service you asked for. We have no legitimate-interest advertising or profiling purposes.",
      },
    ],
  },
  {
    id: "ai-processing",
    heading: "AI processing — the important part",
    blocks: [
      {
        type: "p",
        text: "This deserves its own section because it is where your content leaves our infrastructure.",
      },
      {
        type: "p",
        text: "When you use the AI tutor, generate notes, create a flashcard deck, generate a quiz, ask for a summary, or request a study plan, we send the relevant content to Groq's inference API. What is sent depends on the feature:",
      },
      {
        type: "ul",
        items: [
          "AI tutor — your message, the recent conversation history for that chat, and, when your question concerns an uploaded document, the text of the most relevant chunks retrieved from it.",
          "Note generation from a topic — the topic, subject and depth you selected. No personal data beyond your study interest.",
          "Note generation from pasted text or a PDF — the text you pasted, or the extracted text of your document.",
          "Flashcards and quizzes from a note — that note's content.",
          "Study plan — the goal, subject, timeline, minutes per day, target date and focus areas you entered.",
          "Scholarship AI advisor — your question and the structured eligibility facts of the scholarships involved.",
        ],
      },
      {
        type: "note",
        text: "Practical consequence: do not paste material into EduForge AI that you would not be comfortable sending to a third-party AI provider. That includes other people's personal data, confidential institutional documents, or material you are under a non-disclosure agreement about. We truncate very long inputs before sending them, but truncation is a cost control, not a privacy control.",
      },
      {
        type: "p",
        text: "Groq processes these requests as our service provider under its own terms. We do not train models on your content and we have no ability to grant anyone else that right. API keys are held server-side and are never exposed to your browser.",
      },
      {
        type: "p",
        text: "Embeddings: when you upload a PDF, its text chunks are converted into numerical embeddings so relevant passages can be found later. This runs on our own server using a local open-source model — your document is not sent to any third party to be embedded. The resulting embeddings are derived from your document and stored in our database alongside the chunk text. Note that when you then ask the tutor about that document, the text of the retrieved chunks is sent to Groq as described above.",
      },
    ],
  },
  {
    id: "storage",
    heading: "Where and how data is stored",
    blocks: [
      {
        type: "ul",
        items: [
          "Database — a Supabase-hosted Postgres instance holds your account, profile, study content, activity log, settings and text chunks.",
          "File storage — Supabase Storage holds uploaded PDFs, in a path namespaced by your user id.",
          "Authentication — Supabase Auth issues your session and stores your password hash. We never see or store your password in plain text.",
          "AI provider — Groq processes generation requests. We do not store a copy of your prompts beyond what is written into the conversation or note you can see in the app. Embeddings are computed locally on our own server and are not sent to any third party.",
        ],
      },
      {
        type: "p",
        text: "Every table has Row Level Security enabled, with policies restricting reads and writes to rows whose user id matches the authenticated session. Application queries additionally filter by user id explicitly. Data is encrypted in transit over TLS.",
      },
    ],
  },
  {
    id: "cookies",
    heading: "Cookies and local storage",
    blocks: [
      {
        type: "p",
        text: "We use no advertising or cross-site tracking cookies, and no third-party analytics scripts.",
      },
      {
        type: "ul",
        items: [
          "Session cookies — issued by Supabase Auth to keep you signed in. These are strictly necessary and cannot be disabled without breaking the product.",
          "Browser local storage — a small number of interface preferences, such as your chosen planner view mode. This stays on your device and is never transmitted to us.",
        ],
      },
    ],
  },
  {
    id: "retention",
    heading: "How long we keep it",
    blocks: [
      {
        type: "p",
        text: "For as long as your account exists. We do not run scheduled purges of active accounts, and we do not keep data after you delete it except where a backup cycle has not yet rotated — Supabase retains point-in-time backups for a limited window, after which deleted rows are gone.",
      },
      {
        type: "p",
        text: "If you stop using the product without deleting anything, your data remains stored. We would rather you delete it explicitly than assume abandonment means consent to erase.",
      },
    ],
  },
  {
    id: "your-rights",
    heading: "Your rights and how to exercise them",
    blocks: [
      {
        type: "ul",
        items: [
          "Access — everything we hold about you is visible in the app: your profile, settings, notes, decks, quizzes, tasks, activity history and scholarship profile.",
          "Correction — you can edit all of it directly.",
          "Erasure — Settings, then Account. \"Delete all my data\" removes your notes, decks and cards, quizzes and attempts, tasks, activity history, notifications, uploaded documents, profile and settings, and keeps your login. \"Delete my account\" does the same and also removes your login. Both ask you to type DELETE to confirm.",
          "Portability — there is no automated export yet. Email azanalikhadim02@gmail.com and we will produce an export of your data in a readable format.",
          "Objection and restriction — email us and we will stop the specific processing you object to, which in practice means disabling AI features on your account.",
          "Withdrawal of consent — deleting your data withdraws consent for everything going forward.",
        ],
      },
      {
        type: "p",
        text: "Depending on where you live you may have additional statutory rights, including the right to lodge a complaint with a supervisory authority. We will respond to a verified request without undue delay and in any event within 30 days.",
      },
    ],
  },
  {
    id: "children",
    heading: "Children's privacy",
    blocks: [
      {
        type: "p",
        text: "EduForge AI is intended for students aged 16 and over, and for younger students only with a parent or guardian managing the account. We do not knowingly collect data from children under 16, and we have no features aimed at them.",
      },
      {
        type: "p",
        text: "Because AI generation sends content to a third-party provider, a guardian should review that arrangement before a minor uses the product. If you believe a child under 16 has given us personal data, email azanalikhadim02@gmail.com and we will remove it.",
      },
    ],
  },
  {
    id: "sharing",
    heading: "Who else sees your data",
    blocks: [
      {
        type: "p",
        text: "Only the processors required to run the service:",
      },
      {
        type: "ul",
        items: [
          "Supabase — database, file storage and authentication.",
          "Google — AI generation and embeddings, as described above.",
          "Our hosting provider — serving the application.",
        ],
      },
      {
        type: "p",
        text: "We do not sell personal data, we do not share it with advertisers or data brokers, and we do not disclose it to other users. We would disclose data if legally compelled to, and we would tell you about it unless prohibited from doing so.",
      },
    ],
  },
  {
    id: "security",
    heading: "Security",
    blocks: [
      {
        type: "p",
        text: "Row Level Security on every table, explicit user scoping in application queries, server-side-only API credentials, TLS in transit, and password hashing handled by the authentication provider. We have not undergone an independent penetration test or hold any security certification, and we do not claim otherwise.",
      },
      {
        type: "p",
        text: "Full detail is on our security page. To report a vulnerability, email azanalikhadim02@gmail.com.",
      },
    ],
  },
  {
    id: "accuracy",
    heading: "A note on AI accuracy",
    blocks: [
      {
        type: "note",
        text: "AI-generated notes, flashcards, quizzes and scholarship advice can be wrong, outdated or incomplete. Nothing produced by EduForge AI is professional, legal, financial or academic advice. Always verify eligibility requirements and deadlines against the scholarship provider's official source before you act on them, and check generated study material against your course material before relying on it in an exam.",
      },
    ],
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    blocks: [
      {
        type: "p",
        text: "If we change this policy we will update the date at the top of this page and, for changes that materially affect how your data is used, notify you in the app or by email before the change takes effect. Continued use after a change constitutes acceptance of the revised policy.",
      },
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    blocks: [
      {
        type: "p",
        text: "Questions about this policy, or a request concerning your data: azanalikhadim02@gmail.com. Security disclosures: azanalikhadim02@gmail.com.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy Policy"
      updated={UPDATED}
      intro="What EduForge AI collects, why it collects it, exactly what gets sent to AI providers, and how you delete all of it."
      sections={sections}
    />
  );
}
