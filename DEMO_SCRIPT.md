# EduForge AI — 3-minute demo script

**Hook (15s):** "Students juggle five apps to study one subject, and AI chatbots invent answers. EduForge puts the whole study loop in one place and grounds every answer in *your* material."

1. **Dashboard (20s)** — streak, XP, due cards, upcoming tasks (use the seeded demo account).
2. **AI Tutor + PDF (60s)** — upload `samples/sample-notes.pdf`, ask a question about it, point at the cited source. Mention: chunking, local embeddings, pgvector, Groq.
3. **One-click study set (45s)** — generate flashcards and a quiz from the same material; do 2 cards to show SM-2 intervals.
4. **Scholarships (20s)** — filter, match score, save, AI advisor on one award.
5. **Analytics (10s)** — 90-day XP / retention; "one activity_log table, so numbers can't disagree".
6. **Close (10s)** — Roadmap: voice tutor, learning roadmaps, interview coach, paid plans.

**Fallbacks:** record this flow as a video; keep the app running locally with the model already cached (first embedding run downloads ~85 MB).
**Likely questions:** privacy (local embeddings + RLS), hallucination (retrieval + citations), scale (in-memory rate limiter is per-instance; Redis is the upgrade).
