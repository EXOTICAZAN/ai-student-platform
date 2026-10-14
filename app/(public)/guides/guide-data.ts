export interface GuideStep {
  title: string;
  paragraphs: string[];
}

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: number;
  intro: string[];
  steps: GuideStep[];
  takeaways: string[];
}

export const guideCategories = [
  "Getting Started",
  "AI Tutor",
  "Notes & Flashcards",
  "Quizzes",
  "Scholarships",
  "Planning",
];

export const guides: Guide[] = [
  {
    slug: "getting-started-with-eduforge",
    title: "Getting Started with EduForge AI",
    excerpt:
      "From account creation to your first AI-generated quiz — a complete walkthrough of the platform in the order you should actually use it.",
    category: "Getting Started",
    date: "2026-09-20",
    readingTime: 6,
    intro: [
      "EduForge AI works best as a loop: material goes in (notes, PDFs, conversations), study material comes out (flashcards, quizzes, plans), and your performance feeds the next round. This guide walks through the loop once, end to end, so every feature makes sense in context.",
      "You will need about 30 minutes for the full walkthrough, but each step works on its own — do as much as you have time for.",
    ],
    steps: [
      {
        title: "Create your account",
        paragraphs: [
          "Sign up with email and password, or with Google or GitHub. You will land on your dashboard, which tracks streaks, activity, and progress across every feature. No payment details are requested — billing is not enabled on the platform yet.",
        ],
      },
      {
        title: "Fill in your student profile",
        paragraphs: [
          "Add your field of study, level, and goals. This profile powers scholarship matching, so the more accurate it is, the more relevant the matches. You can update it any time; matching re-runs against the new data.",
        ],
      },
      {
        title: "Upload your first document",
        paragraphs: [
          "Open the AI tutor and upload a PDF — lecture slides or a reading work best for a first try. The document is chunked and indexed so the tutor can answer questions grounded in your actual course material instead of generic knowledge.",
          "Only upload documents you have the right to use for personal study.",
        ],
      },
      {
        title: "Interrogate the document",
        paragraphs: [
          "Ask the tutor targeted questions: \"What are the three main arguments of this chapter?\", \"Explain section 2.3 like I'm seeing it for the first time\", \"What prerequisites does this assume I already know?\" Ten minutes of questioning will tell you more about your gaps than an hour of reading.",
        ],
      },
      {
        title: "Distil your findings into a note",
        paragraphs: [
          "Create a note capturing the key ideas in your own words: definitions, core claims, and the questions you initially got wrong. Keep it under 400 words — compression is the point. The AI can help you summarise, but rewrite in your own voice; that rewriting is where retention happens.",
        ],
      },
      {
        title: "Turn the note into flashcards",
        paragraphs: [
          "Generate a flashcard deck from the note. Edit the generated cards: split any card that asks two things, and reword prompts so they force recall rather than recognition. A deck of 15 sharp cards beats 40 vague ones.",
        ],
      },
      {
        title: "Generate a quiz and take it cold",
        paragraphs: [
          "Create a quiz from the same note and take it without looking anything up — treat it like a real exam. Review every explanation afterwards, especially for questions you got right by guessing. Feed each genuine miss back into your deck as a new card.",
        ],
      },
      {
        title: "Plan the week around the loop",
        paragraphs: [
          "Add planner tasks for your review sessions: daily card reviews (10 minutes), the next document upload, and a weekly quiz. Give each task a duration estimate — seeing the week's real load is the difference between a plan and a wish.",
        ],
      },
    ],
    takeaways: [
      "The core loop is: material in, retrieval practice out, misses fed back in.",
      "Edit every AI-generated card and note — the editing is itself studying.",
      "Plan review sessions before you need them, not after you fall behind.",
    ],
  },
  {
    slug: "write-a-winning-scholarship-essay",
    title: "How to Write a Winning Scholarship Essay",
    excerpt:
      "A nine-step process for turning a prompt into an essay reviewers remember: deconstruct, brainstorm, choose one story, structure, draft, and revise with outside eyes.",
    category: "Scholarships",
    date: "2026-09-10",
    readingTime: 8,
    intro: [
      "Scholarship committees read hundreds of essays per cycle. The ones that win are rarely the most dramatic — they are the most specific, the most reflective, and the most precisely aimed at the prompt. This guide turns that into a repeatable process.",
      "Budget roughly four to six hours per essay across all steps, spread over a week if the deadline allows. Good essays are made in the gaps between drafts.",
    ],
    steps: [
      {
        title: "Deconstruct the prompt",
        paragraphs: [
          "Rewrite the prompt in your own words as a checklist of requirements: themes it asks about, whether it wants past experience or future goals, word count, and format. Score yourself against this checklist at the end — if the essay does not answer the literal question, nothing else matters.",
        ],
      },
      {
        title: "Brainstorm evidence, not topics",
        paragraphs: [
          "List 8–10 concrete episodes from your life that demonstrate the quality the prompt is probing: projects, failures, jobs, conversations, turning points. For each, note one specific detail (a number, a quote, a moment). Do not think about the essay yet — you are mining raw material.",
        ],
      },
      {
        title: "Choose one story",
        paragraphs: [
          "Pick the episode that is most specific and most clearly connected to the prompt — not the most impressive-sounding. One story examined deeply beats three stories name-dropped. If two episodes are equally good, choose the one where you changed your mind or behaviour, because reflection needs a before-and-after.",
        ],
      },
      {
        title: "Outline: hook, scene, reflection, fit",
        paragraphs: [
          "Four beats. (1) A two-sentence hook that drops the reader into the scene. (2) Context and the action — what happened, what you did, with concrete detail. (3) Reflection — what you learned, what you changed, what you did next. (4) Fit — how that trajectory connects to your studies and why this scholarship matters to it now. Beat three deserves the most words; it is where most essays are weakest.",
        ],
      },
      {
        title: "Draft without editing",
        paragraphs: [
          "Write the whole thing in one sitting, over the word limit, badly. The goal is to get the story and the reflection on the page; polish is a later phase. If you edit while drafting, you will never finish either.",
        ],
      },
      {
        title: "Cut to the limit, then cut 10% more",
        paragraphs: [
          "Delete every sentence that could appear in someone else's essay: sweeping openers, generic claims about passion and journeys, adjectives doing a verb's job (\"I am hardworking\" → the fact that proves it). Then read aloud and cut everything your ear trips on. Specific nouns and numbers survive; abstractions go.",
        ],
      },
      {
        title: "Get two readers",
        paragraphs: [
          "One who knows you checks honesty and emphasis (\"is that really the important part?\"). One who does not know you checks comprehension: ask them to summarise the essay in one sentence and to name the quality they think it demonstrates. If their answers do not match your intent, the essay — not the reader — needs work.",
        ],
      },
      {
        title: "Verify every factual requirement",
        paragraphs: [
          "On the provider's official page, confirm the deadline, word limit, format, and eligibility. Never trust a remembered date or a third-party aggregator for these. Screenshot or save the official listing with the date you checked it.",
        ],
      },
      {
        title: "Submit early, keep the materials",
        paragraphs: [
          "Submit at least three days before the deadline to absorb technical failures. Save the final version plus your outline and brainstorm list in a reusable materials folder — the next essay starts from evidence, not a blank page.",
        ],
      },
    ],
    takeaways: [
      "Specific scenes with concrete details outperform impressive-sounding generalities.",
      "The reflection beat is where essays are won — budget the most words for it.",
      "Deadlines, limits, and eligibility are verified on official sources only.",
    ],
  },
  {
    slug: "using-spaced-repetition-effectively",
    title: "Using Spaced Repetition Effectively",
    excerpt:
      "How to write atomic cards, grade yourself honestly, survive lapses, and keep a daily review habit alive for a whole semester.",
    category: "Notes & Flashcards",
    date: "2026-08-28",
    readingTime: 6,
    intro: [
      "Spaced repetition is the highest-leverage study technique with the worst first impressions: it feels harder than rereading and its benefits compound invisibly over weeks. This guide covers the mechanics that make the difference between a deck you trust and a deck you abandon.",
    ],
    steps: [
      {
        title: "Write atomic cards",
        paragraphs: [
          "One idea per card, answerable in under fifteen seconds. If a card asks \"Explain photosynthesis\", split it into inputs, outputs, location, and the role of chlorophyll. Atomic cards give precise feedback — you know exactly which piece failed — and keep daily review fast enough to survive a busy week.",
        ],
      },
      {
        title: "Phrase prompts as retrieval, not recognition",
        paragraphs: [
          "\"What is the term for X?\" is weaker than \"X happens because of ____. What and why?\" The best cards make you produce the answer, not identify it. Avoid yes/no cards and cards with the answer in the question — your brain will take every shortcut you leave open.",
        ],
      },
      {
        title: "Start reviewing before you feel ready",
        paragraphs: [
          "Create cards the same day you encounter the material and review from day one. The spacing effect needs a little forgetting to work: reviewing while everything is still fresh wastes the session, because successful retrieval of a barely-faded memory strengthens it only slightly.",
        ],
      },
      {
        title: "Grade yourself honestly",
        paragraphs: [
          "Almost-right is wrong. When you grade a review, ask \"could I have produced this on an exam, cold?\" — not \"does this look familiar?\" Generous self-grading feels kind and quietly destroys the schedule, because cards you half-know stop resurfacing before the exam does.",
        ],
      },
      {
        title: "Treat lapses as data",
        paragraphs: [
          "Forgetting a card you knew is normal and useful: it tells the scheduler the interval was too long, and it tells you the memory needed reconsolidation anyway. The only bad response to a lapse is deleting or weakening the card so it stops bothering you.",
        ],
      },
      {
        title: "Interleave subjects",
        paragraphs: [
          "Mix decks from different courses in one session rather than blocking by subject. Interleaving feels messier and produces better discrimination — you learn not just the answer, but which answer applies when. EduForge AI's review queue already interleaves due cards; resist the urge to filter to one subject every day.",
        ],
      },
      {
        title: "Cap your daily new cards",
        paragraphs: [
          "New cards create future reviews. Adding 50 cards a day builds a backlog of 300+ reviews within two weeks — the number one cause of deck abandonment. Ten to twenty new cards a day, on top of due reviews, sustains a full semester comfortably.",
        ],
      },
      {
        title: "Back it up with weekly quizzes",
        paragraphs: [
          "Cards test atoms; exams test structure. Once a week, generate a quiz over that week's material and take it under exam conditions. Concepts that fail the quiz become new cards — this closes the loop between granular memory and integrated understanding.",
        ],
      },
    ],
    takeaways: [
      "Atomic, retrieval-phrased cards are 80% of the battle.",
      "Honest grading keeps the schedule truthful; lapses are information, not failure.",
      "Cap new cards per day — sustainability beats intensity.",
    ],
  },
  {
    slug: "getting-the-most-from-the-ai-tutor",
    title: "Getting the Most from the AI Tutor",
    excerpt:
      "Practical patterns for tutoring conversations: grounding in your documents, Socratic mode, level calibration, self-testing, and knowing when to verify.",
    category: "AI Tutor",
    date: "2026-08-14",
    readingTime: 7,
    intro: [
      "The AI tutor is a conversation, and like any conversation, the quality of what comes out depends heavily on what goes in. This guide collects the patterns that consistently turn generic answers into genuine learning.",
    ],
    steps: [
      {
        title: "Ground the conversation in your material",
        paragraphs: [
          "Upload the relevant PDF or paste the specific passage before asking questions. Grounded answers use your course's terminology, notation, and framing — the version your exam will use — and reduce the chance of the tutor answering a subtly different question from a different textbook's perspective.",
        ],
      },
      {
        title: "Declare your level every time",
        paragraphs: [
          "\"Explain this for a first-year student who has done high-school algebra but not linear algebra\" changes vocabulary, examples, and depth. When an answer misses, recalibrate explicitly: \"simpler\", \"with an analogy from everyday life\", or \"go deeper — I want the mechanism\". Level-setting is the fastest single improvement to answer quality.",
        ],
      },
      {
        title: "Use Socratic mode for problem sets",
        paragraphs: [
          "For anything you will be graded on, prompt: \"Don't give me the answer. Ask me one question at a time that leads me to it.\" You stay in the driver's seat, the tutor exposes the exact assumption you are missing, and the solution you reach is yours — which is the only version that sticks.",
        ],
      },
      {
        title: "Request examples, counterexamples, and analogies",
        paragraphs: [
          "Understanding a definition is easy; knowing its boundaries is mastery. Ask for \"a worked example\", then \"an example that almost qualifies but doesn't, and why\", then \"where this analogy breaks down\". Counterexamples are the most underused prompt in existence.",
        ],
      },
      {
        title: "Make the tutor quiz you",
        paragraphs: [
          "At the end of a topic, flip roles: \"Quiz me with five questions, one at a time. After each answer, tell me if I was right and explain every option.\" Wrong answers here are free — the same mistakes on the exam are not. Ask for a different question style each session (multiple choice, short answer, spot-the-error).",
        ],
      },
      {
        title: "End with a summary you act on",
        paragraphs: [
          "Close each session with \"What did I get wrong today, and what should I review tomorrow?\" Turn the answer into planner tasks or flashcards while the context is fresh. A tutoring session that produces no follow-up artefact evaporates within days.",
        ],
      },
      {
        title: "Verify anything consequential",
        paragraphs: [
          "The tutor can be confidently wrong, especially about specific numbers, citations, recent events, and anything with a deadline. Ask it to show its reasoning and re-derive the steps; cross-check consequential facts against primary sources. For scholarships and administrative rules, only official sources count.",
        ],
      },
    ],
    takeaways: [
      "Ground, calibrate level, and ask for hints instead of answers.",
      "Counterexamples and self-quizzing separate familiarity from mastery.",
      "Every session should end in an artefact: cards, tasks, or a review list.",
    ],
  },
  {
    slug: "turning-lecture-pdfs-into-notes",
    title: "Turning Lecture PDFs into Study-Ready Notes",
    excerpt:
      "A pipeline for converting slide decks and readings into notes you actually revisit: question the document, distil in your own words, and link to cards.",
    category: "Notes & Flashcards",
    date: "2026-07-30",
    readingTime: 6,
    intro: [
      "Downloading slides is not studying, and summarising them with one click is barely better — the value is in the processing you do, not the text you produce. This guide structures that processing into a repeatable pipeline.",
    ],
    steps: [
      {
        title: "Survey before you read",
        paragraphs: [
          "Spend five minutes on structure only: titles, section headers, figures, summary slides. Write down three questions you expect the material to answer. A survey gives your reading a skeleton to hang details on — unstructured reading of a 60-slide deck retains surprisingly little.",
        ],
      },
      {
        title: "Upload and question the document",
        paragraphs: [
          "Put the PDF into an EduForge AI chat and work through your questions plus the ones that emerge as you read: \"What does the author mean by X on slide 14?\", \"Why does this formula assume Y?\", \"How does this relate to what chapter 3 said about Z?\" Each question you genuinely ask and get answered is a gap you will not hit on the exam.",
        ],
      },
      {
        title: "Write the distillation in your own words",
        paragraphs: [
          "Close the document and write a note from memory: the two or three load-bearing ideas, key definitions, and what you got wrong during the Q&A. Then reopen and correct. This retrieve-then-check cycle takes longer than copying and retains dramatically more — the note is a record of your understanding, not of the author's sentences.",
        ],
      },
      {
        title: "Keep notes short and structured",
        paragraphs: [
          "Aim for under 400 words per lecture: definitions section, core ideas section, open questions section. Long notes are never revisited; short notes become the source for cards and quizzes. If you cannot compress it, you do not yet understand it — which is exactly what the compression is for.",
        ],
      },
      {
        title: "Branch into cards and quizzes",
        paragraphs: [
          "Generate flashcards from the note the same day, editing each card to be atomic and retrieval-phrased. Once a week, generate a quiz across that week's notes and take it cold. The note is the hub; cards and quizzes are the spokes that keep it alive in memory.",
        ],
      },
      {
        title: "Respect rights and relevance",
        paragraphs: [
          "Upload only material you have the right to use for personal study — your institution's own slides, your notes, or openly licensed texts. And prune ruthlessly: not every distributed PDF deserves the full pipeline. Prioritise by course weight and exam relevance; a perfect system applied to everything is a system you will abandon.",
        ],
      },
    ],
    takeaways: [
      "Survey, question, then distil from memory — in that order.",
      "Short notes you revisit beat comprehensive notes you never open.",
      "Every note should spawn cards and feed a weekly quiz.",
    ],
  },
  {
    slug: "exam-prep-with-generated-quizzes",
    title: "Preparing for Exams with Generated Quizzes",
    excerpt:
      "How to use AI-generated quizzes as mock exams: simulate conditions, mine every mistake, target weak topics, and schedule a final rehearsal.",
    category: "Quizzes",
    date: "2026-07-16",
    readingTime: 6,
    intro: [
      "Generated quizzes are most students' favourite EduForge AI feature and their most underused one: taken casually, right after studying, with materials at hand, they flatter you. Taken properly, they are the most accurate predictor of exam performance you can build yourself.",
    ],
    steps: [
      {
        title: "Generate from the right sources",
        paragraphs: [
          "Build quizzes from your distilled notes and uploaded course documents — not from a topic name alone. Quizzes grounded in your actual course material test the definitions and framings your exam will use. One quiz per subject per week is a sustainable rhythm during term time.",
        ],
      },
      {
        title: "Simulate exam conditions",
        paragraphs: [
          "No notes, no tabs, no phone, and a timer proportional to the question count. Take it in one sitting. The point of a mock exam is to reproduce the retrieval conditions of the real thing — knowing material with your notes open is a different (and untested) skill.",
        ],
      },
      {
        title: "Mine every mistake — and every lucky guess",
        paragraphs: [
          "For each wrong answer, read the explanation and classify the failure: did you not know it, misread the question, or know it but pick a plausible distractor? Each class has a different fix — new card, slower reading habit, or a card specifically about that distractor. Flag questions you answered correctly without confidence; those are misses in disguise.",
        ],
      },
      {
        title: "Target the weak topics",
        paragraphs: [
          "After grading, generate a follow-up quiz on the topics you missed — or ask the AI tutor to re-explain them before re-quizzing. Two focused rounds on weak material outperform another full-scope quiz; the second round should feel noticeably different.",
        ],
      },
      {
        title: "Schedule a final rehearsal",
        paragraphs: [
          "Three to five days before the exam, take one final generated quiz covering everything, again under exam conditions. This is dress rehearsal, not learning: the goal is calibration — confirming scores are where you need them and surfacing last-minute gaps while there is still time.",
        ],
      },
      {
        title: "Track the trend, not the score",
        paragraphs: [
          "Single scores are noisy; the trend across weeks is signal. If quiz scores on a subject plateau below your target for three consecutive weeks, change the input (better notes, more cards, tutor sessions on the stuck concepts) rather than taking more quizzes on the same broken foundation.",
        ],
      },
    ],
    takeaways: [
      "Exam conditions are non-negotiable — casual quizzes produce false confidence.",
      "Classify every miss; each failure type has a different fix.",
      "Trends across weeks matter more than any single score.",
    ],
  },
  {
    slug: "planning-a-realistic-study-week",
    title: "Planning a Realistic Study Week",
    excerpt:
      "A weekly planning ritual that survives contact with real life: fixed commitments first, deep work next, retrieval sprinkled daily, and buffers you'll actually use.",
    category: "Planning",
    date: "2026-06-25",
    readingTime: 5,
    intro: [
      "Most study plans fail because they are aspirational: eight hours of deep work a day, no buffers, no acknowledgement that Tuesday has a lab until six. A realistic plan is smaller, scheduled around fixed commitments, and reviewed weekly. Here is the ritual.",
    ],
    steps: [
      {
        title: "Start from your fixed skeleton",
        paragraphs: [
          "Block out lectures, labs, work shifts, commuting, sleep, and one genuine rest block per day first. What remains is your real capacity — usually far less than the plan-less version of you assumed. Planning into time that does not exist is the root of most abandoned schedules.",
        ],
      },
      {
        title: "Define outcomes, not hours",
        paragraphs: [
          "For each subject this week, write one or two concrete outcomes: \"finish cards for chapter 4\", \"complete two past-paper questions on glycolysis\", \"draft scholarship essay outline\". Hours are an input; outcomes are the point. In the EduForge AI planner, each outcome becomes a task with a duration estimate.",
        ],
      },
      {
        title: "Schedule deep work at your best hours",
        paragraphs: [
          "Put the hardest cognitive work — new material, writing, problem sets — in the two or three hours a day when you are sharpest, and defend that slot like a meeting with someone important. Routine work (formatting notes, admin, light review) goes in the troughs.",
        ],
      },
      {
        title: "Sprinkle retrieval daily",
        paragraphs: [
          "Flashcard reviews belong in small daily slots (10–20 minutes), not weekend marathons — spacing is the whole mechanism. Schedule them at consistent anchors (after breakfast, between classes) so they run on habit rather than decision.",
        ],
      },
      {
        title: "Add buffers, then trust them",
        paragraphs: [
          "Leave roughly 20% of discretionary time unallocated and one longer open block mid-week. Overruns are not exceptions; they are the base rate. A plan without buffers converts one bad day into a collapsed week — and collapsed weeks get abandoned.",
        ],
      },
      {
        title: "Review weekly and adjust one thing",
        paragraphs: [
          "Thirty minutes on Sunday (or your week boundary): what got done, what slipped, and why. Then change exactly one variable for next week — move a subject, shrink an estimate, relocate a session. Small evidenced adjustments compound; wholesale schedule rewrites every Monday never survive contact with reality.",
        ],
      },
    ],
    takeaways: [
      "Plan around the fixed skeleton; what remains is your real capacity.",
      "Outcomes and estimates beat open-ended hour blocks.",
      "Buffers and a weekly one-change review keep the system alive all semester.",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
