import type { FaqItem } from "@/components/public/FaqExplorer";

export const faqCategories = [
  "Getting started",
  "AI Tutor",
  "Notes & flashcards",
  "Quizzes",
  "Scholarships",
  "Account & data",
];

export const faqs: FaqItem[] = [
  {
    category: "Getting started",
    question: "How do I create an account?",
    answer:
      "Click Sign up in the top navigation, enter your name, email and a password of at least 8 characters, then confirm your email address from the link we send you. You will land on your dashboard straight afterwards. No payment details are needed — billing is not enabled on EduForge AI yet.",
  },
  {
    category: "Getting started",
    question: "What order should I use the features in?",
    answer:
      "The loop that works best is: put material in, get study material out, then measure yourself. Concretely — upload a PDF or paste your lecture notes into AI Notes, turn that note into a flashcard deck and a quiz, add the resulting sessions to your Study Planner, and check Analytics weekly to see what is actually sticking.",
  },
  {
    category: "Getting started",
    question: "What do XP, levels and streaks mean?",
    answer:
      "Every meaningful action awards XP: creating a note is 15, generating one with AI is 25, completing a task is 30, finishing a quiz is 40 plus a 25-point bonus for a perfect score, and each flashcard you review is 2. Levels are 1000 XP apart. Your streak counts consecutive calendar days with at least one recorded activity, and it resets if you miss a full day.",
  },
  {
    category: "Getting started",
    question: "Does EduForge AI work on mobile?",
    answer:
      "Yes. The dashboard is responsive and every feature works in a mobile browser, including the flashcard flip view and quiz taking. There is no native iOS or Android app at the moment.",
  },
  {
    category: "AI Tutor",
    question: "How do I chat with a PDF?",
    answer:
      "Open AI Tutor, start a new chat, and use the upload control to attach a PDF. The file is stored, its text is extracted, split into overlapping chunks, and each chunk is embedded. From then on that chat answers questions using the relevant chunks from your document rather than only the model's general knowledge.",
  },
  {
    category: "AI Tutor",
    question: "Why does the tutor sometimes not use my document?",
    answer:
      "Retrieval is triggered by the shape of your question. Asking something clearly about the material — for example 'what does chapter 3 say about X' or 'summarise this document' — pulls in your chunks. Very general questions may be answered from the model alone. Mentioning the document explicitly is the most reliable way to force retrieval.",
  },
  {
    category: "AI Tutor",
    question: "Which file types can I upload?",
    answer:
      "PDF only, at the moment. The extraction pipeline is built for PDF text. Scanned images of pages will not extract usefully because there is no OCR stage yet — if your PDF is a scan, export a text version first.",
  },
  {
    category: "AI Tutor",
    question: "Can I stop a long answer mid-stream?",
    answer:
      "Yes. While the tutor is writing, the send button becomes a stop control. Pressing it aborts the stream immediately. Text generated up to that point is kept in the conversation and saved.",
  },
  {
    category: "Notes & flashcards",
    question: "How does AI note generation work?",
    answer:
      "There are three sources: a topic (the model writes structured markdown notes from scratch), pasted text (the model condenses your material without adding facts that are not there), or an uploaded PDF (the model works from your document's extracted chunks). Every result is editable markdown afterwards, and the preview renders headings, tables and LaTeX.",
  },
  {
    category: "Notes & flashcards",
    question: "Are my notes saved automatically?",
    answer:
      "Yes. The editor autosaves about 1.2 seconds after you stop typing, and the toolbar shows the current state — unsaved changes, saving, or saved. Edits are also flushed when you close or navigate away from the tab. You can still press Save explicitly if you prefer.",
  },
  {
    category: "Notes & flashcards",
    question: "What do Again, Hard, Good and Easy do?",
    answer:
      "They grade how well you recalled a card and drive a simplified SM-2 spaced-repetition schedule. Again resets the card to zero days, counts a lapse and lowers its ease factor. Hard extends the interval modestly and lowers ease slightly. Good multiplies the interval by the card's ease factor. Easy does the same with a 1.3 bonus and raises ease. Ease never drops below 1.3.",
  },
  {
    category: "Notes & flashcards",
    question: "How are due cards chosen?",
    answer:
      "A study session loads cards whose due date is at or before now. If nothing is due you will see an 'all caught up' screen showing the next due date, with an option to study the whole deck anyway. Grading a card pushes its due date out according to the interval you earned.",
  },
  {
    category: "Quizzes",
    question: "How many questions can I generate?",
    answer:
      "Between 3 and 25 per quiz, at easy, medium, hard or mixed difficulty. Mixed produces roughly a third of each. Each question has exactly four options, one correct answer, and an explanation that covers why the right answer is right and why the main distractor is wrong.",
  },
  {
    category: "Quizzes",
    question: "Can I build a quiz from my own notes?",
    answer:
      "Yes. From the note editor press Make quiz, or choose one of your notes in the generate dialog on the quiz page. The questions are then derived strictly from that note's content rather than the model's general knowledge, which is what you want for course-specific revision.",
  },
  {
    category: "Quizzes",
    question: "Is my attempt saved if I close the tab?",
    answer:
      "No. Attempts are persisted only when you press Finish, so an abandoned quiz leaves no partial record. Your answers are kept in memory during the session so you can go back through the review screen afterwards.",
  },
  {
    category: "Scholarships",
    question: "How does scholarship matching work?",
    answer:
      "Matching is deterministic, not AI-guessed. Each scholarship has structured eligibility requirements — nationality, degree level, field, academic score, language tests, graduation year — and your profile is evaluated against each rule. Every requirement resolves to pass, fail, unknown or needs review, and those combine into a score out of 100 plus a category such as strong match or not eligible.",
  },
  {
    category: "Scholarships",
    question: "Why do some matches say 'unknown'?",
    answer:
      "Because a rule could not be evaluated from the data available — usually a field you left blank in your profile, or a requirement the scholarship states only in prose. Completing your profile resolves most unknowns. Anything marked needs review is a case where a human should read the official source.",
  },
  {
    category: "Scholarships",
    question: "Can I trust the deadlines shown?",
    answer:
      "Treat them as a starting point, not a fact. Every scholarship record carries an official source URL and a verification status. Deadlines change and scholarship pages move, so always confirm on the official site before you plan around a date — particularly for anything you intend to apply to this cycle.",
  },
  {
    category: "Account & data",
    question: "Where is my data stored?",
    answer:
      "In a Supabase Postgres database, with uploaded PDFs in Supabase Storage. Every table has Row Level Security enabled and is scoped to your own user id, so your notes, cards, quizzes and tasks are not readable by other users. AI generation sends the relevant content to Groq's inference API; PDF embeddings are computed locally on our own server. See the privacy policy for the detail.",
  },
  {
    category: "Account & data",
    question: "How do I delete everything?",
    answer:
      "Open Settings, go to the Account tab, and use Delete all my data in the danger zone. You will be asked to type DELETE to confirm. This removes your notes, decks and cards, quizzes and attempts, tasks, activity history, notifications, uploaded documents and settings. Your login credentials remain with Supabase Auth, so you can start again from a clean slate.",
  },
  {
    category: "Account & data",
    question: "I did not receive my verification email.",
    answer:
      "Check spam and promotions folders first, and confirm the address you typed at signup. Supabase rate-limits confirmation emails, so waiting a minute before requesting another resend usually helps. If it still does not arrive, contact azanalikhadim02@gmail.com from a different address and we will sort it out manually.",
  },
  {
    category: "Account & data",
    question: "How do I change my password?",
    answer:
      "Settings → Account → Change password. Enter your current password and the new one twice; the new password must be at least 8 characters. If your session has gone stale the flow re-authenticates you automatically before applying the change.",
  },
];
