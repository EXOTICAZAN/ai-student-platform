# AI Student Platform 🇵🇰 🎓

An AI-powered MERN web application tailored for Pakistani students, featuring localized bilingual AI tutoring, step-by-step STEM problem solving, PDF study document synthesis, live AI scholarship matching, personalized course roadmaps, and career & internship discovery.

---

## 🏗️ Architecture & Monorepo Structure

```text
/
├── .agents/                 # AI Assistant rules and persistent project context
├── client/                  # Frontend: React (Vite) + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/      # Layout (Navbar, Sidebar, AppLayout) and UI Primitives (Toasts, Skeletons)
│   │   ├── context/         # AuthContext (JWT session) & ToastContext (global notifications)
│   │   ├── pages/           # Learning modules (Dashboard, Tutor, PdfTools, StemSolver, Scholarships, Courses, Career)
│   │   ├── App.jsx          # Protected route shell & global provider setup
│   │   └── main.jsx         # React DOM entry point
│   ├── .env.example         # Frontend environment configuration template
│   └── vite.config.js       # Vite bundler config with backend proxy
├── server/                  # Backend: Node.js + Express API
│   ├── config/              # MongoDB connection & centralized Gemini AI Gateway (`gemini.js`)
│   ├── controllers/         # Feature handlers (Auth, Tutor, Documents, STEM, Scholarships, Courses, Career)
│   ├── middleware/          # Auth (`requireAuth`), Rate Limiting (`aiRateLimiter`), Input Validation (`validateBody`)
│   ├── models/              # Mongoose schemas (User, Conversation, Document, SavedScholarship, Roadmap, SavedOpportunity)
│   ├── routes/              # Express API endpoints
│   ├── .env.example         # Backend environment configuration template
│   └── server.js            # Express server initialization
├── scratch/                 # Automated test & verification scripts
├── package.json             # Root monorepo orchestration scripts
└── README.md
```

---

## ⚙️ Environment Variables Reference

### Backend Configuration (`server/.env`)

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Port on which the Express server runs | `5000` |
| `MONGODB_URI` | **Yes** | Connection string for MongoDB (Local or Atlas) | `mongodb://localhost:27017/ai-student-platform` |
| `JWT_SECRET` | **Yes** | Secret key for signing session tokens | `your_strong_random_jwt_secret_key_here` |
| `GEMINI_API_KEY` | **Yes** | API key for Google Gemini 1.5 Flash models | `AIzaSy...` |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud OAuth 2.0 Client ID | `123456...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud OAuth 2.0 Client Secret | `GOCSPX-...` |
| `CLIENT_URL` | **Yes** | Frontend client URL for CORS & OAuth redirects | `http://localhost:5173` |
| `SERVER_URL` | **Yes** | Backend server URL | `http://localhost:5000` |

### Frontend Configuration (`client/.env`)

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | Backend API base path prefix | `http://localhost:5000/api` |

---

## 🔑 How to Obtain API Keys & Credentials

### 1. Google Gemini API Key
1. Visit **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with your Google account.
3. Click **"Get API key"** in the top navigation bar.
4. Click **"Create API key in new project"** (or select an existing Google Cloud project).
5. Copy the generated API key and paste it into `server/.env` as `GEMINI_API_KEY=AIzaSy...`.

### 2. Google OAuth 2.0 (Google Login)
1. Go to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - Choose **External** and fill in the required App Name and Support Email.
4. Navigate to **APIs & Services** $\rightarrow$ **Credentials**:
   - Click **Create Credentials** $\rightarrow$ **OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: `http://localhost:5000`, `http://localhost:5173`.
   - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`.
5. Copy the **Client ID** and **Client Secret** into `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
*(Note: For instant local testing without Google OAuth keys, the app includes a 1-click **Development Fast Login** on the login screen).*

---

## 🚀 Getting Started

### 1. Install all dependencies
Run this command from the project root:
```bash
npm run install:all
```

### 2. Configure Environment Files
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Ensure `GEMINI_API_KEY` and `MONGODB_URI` are configured in `server/.env`.

### 3. Run Development Servers
```bash
npm run dev
```
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧭 Platform Features & Routes

| Path | Feature | Highlights |
| :--- | :--- | :--- |
| `/login` | **Authentication** | Google OAuth 2.0 and instant local development login. |
| `/onboarding` | **Profile Setup** | Configures student grade, board (FBISE, BISE Lahore, etc.), and academic interests. |
| `/dashboard` | **Central Hub** | Metric counters, learning overview, quick actions, and system health status. |
| `/tutor` | **AI Tutor** | Bilingual (Urdu/English) tutoring with conversational context and saved chat sessions. |
| `/pdf-tools` | **PDF Study Tools** | Document text extraction, AI chapter summaries, interactive flashcards & practice quizzes. |
| `/stem-solver` | **STEM Solver** | Chemical equation balancer, step-by-step mathematical working, and KaTeX LaTeX rendering. |
| `/scholarships` | **Scholarship Discovery** | Live AI matching for Pakistani national schemes (HEC, PEEF) & global grants (Fulbright, Chevening, DAAD) + guided application assistant. |
| `/courses` | **Course Roadmaps** | Progressive vertical stepper learning paths, curated video lectures, and milestone mastery quizzes. |
| `/career` | **Career & Internships** | Live discovery of top Pakistani tech employers and global remote positions with official portal links. |

---

## 🛡️ Security & Quota Protection
- **Route Protection**: All educational and AI endpoints are strictly guarded by `requireAuth` JWT middleware.
- **Quota Safeguards**: An in-memory sliding-window rate limiter (`aiRateLimiter`) prevents Gemini API quota exhaustion.
- **Input Validation**: All incoming POST and PATCH payloads are validated using declarative schema middleware (`validateBody`).
- **Structured JSON Enforcements**: AI JSON responses are strictly validated and parsed through the centralized gateway with automatic retries on rate limits.
