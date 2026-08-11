# AI Job Application Analyzer

## Project Summary

Full-stack AI tool that analyzes job postings against a developer resume using Claude AI.
Returns match score, skill gaps, radar chart visualization, and generates a tailored cover letter.
All AI responses stream in real-time via SSE (Server-Sent Events).

---

## Tech Stack

### Frontend (`apps/frontend`)

- React 18 + Vite 5 + TypeScript (strict mode)
- React Router v6 — data router pattern (loaders/actions)
- TanStack Query v5 — server state
- Zustand v4 — client state (immer + persist + devtools middleware)
- React Hook Form v7 + Zod — form validation
- Recharts — RadarChart, BarChart, AreaChart
- Framer Motion — page transitions, score animations
- shadcn/ui + Tailwind CSS v3 — design system
- react-dropzone — PDF drag & drop upload
- pdfjs-dist — PDF preview in browser
- react-hot-toast — notifications

### Backend (`apps/backend`)

- Node.js 20 (ESM) + Express 5 + TypeScript
- Anthropic SDK — model: `claude-sonnet-5`, streaming enabled
- pdf-parse — extract text from uploaded PDFs
- multer — file upload handling
- Zod — request validation middleware
- helmet + cors + morgan — security & logging
- envalid — environment variable validation

### Shared (`packages/shared`)

- TypeScript types shared between frontend and backend

### Tooling

- pnpm workspaces (monorepo)
- Docker + docker-compose
- ESLint (airbnb-typescript) + Prettier + Husky + lint-staged
- Vitest + React Testing Library + MSW + supertest
- GitHub Actions CI (lint + test + build)
- Deploy: Vercel (frontend) + Railway (backend)

---

## Folder Structure

```
ai-job-analyzer/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── App.tsx
│   │       │   ├── router.tsx        # data router
│   │       │   ├── providers.tsx     # QueryClient, Toaster, ThemeProvider
│   │       │   └── store.ts          # root Zustand store
│   │       ├── features/
│   │       │   ├── analysis/
│   │       │   │   ├── components/   # AnalysisForm, AnalysisResult,
│   │       │   │   │                 # MatchScoreCard, SkillRadarChart,
│   │       │   │   │                 # SkillGapList, AtsScoreCard,
│   │       │   │   │                 # RedFlagList, StreamingOutput
│   │       │   │   ├── hooks/        # useStreamAnalysis, useAnalysisHistory
│   │       │   │   ├── schemas/      # Zod schemas
│   │       │   │   └── api/          # API call functions
│   │       │   ├── generate/         # post-analysis artifacts
│   │       │   │   ├── components/   # GeneratePanel, ResumePdf
│   │       │   │   ├── hooks/        # useGenerate
│   │       │   │   └── lib/          # docx.ts (resume + letter .docx builders)
│   │       │   ├── resume/
│   │       │   │   ├── components/   # ResumeUploader, ResumePreview
│   │       │   │   └── hooks/        # useResumeStore (Zustand slice)
│   │       │   └── history/
│   │       │       ├── components/   # HistoryList, HistoryItem, CompareDrawer
│   │       │       └── hooks/        # useHistory
│   │       ├── shared/
│   │       │   ├── components/       # Layout, Sidebar, ThemeToggle, ErrorBoundary
│   │       │   ├── hooks/            # useSSE, useLocalStorage, useDebounce
│   │       │   └── lib/              # api-client, query-client, cn()
│   │       └── pages/
│   │           ├── HomePage.tsx
│   │           ├── AnalyzePage.tsx
│   │           ├── HistoryPage.tsx
│   │           └── ComparePage.tsx
│   │
│   └── backend/
│       └── src/
│           ├── routes/         # analyze.route.ts, upload.route.ts
│           ├── controllers/    # analyze.controller.ts, upload.controller.ts
│           ├── services/       # claude.service.ts, pdf.service.ts
│           ├── middleware/     # validate, error, upload
│           ├── prompts/        # analyze.prompt.ts, coverletter.prompt.ts
│           ├── schemas/        # Zod schemas
│           ├── config/         # env.ts (envalid)
│           └── app.ts
│
├── packages/
│   └── shared/
│       └── src/types.ts        # AnalysisResult, SSEEvent, SkillGap, etc.
│
├── docker-compose.yml
├── pnpm-workspace.yaml
└── CLAUDE.md
```

---

## Core Types (packages/shared/src/types.ts)

```typescript
export interface AnalysisResult {
  matchScore: number; // 0–100
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  categoryScores: {
    technicalSkills: number;
    experience: number;
    cultureFit: number;
    keywords: number;
    seniority: number;
    tools: number;
  };
  strengths: string[];
  skillGaps: SkillGap[];
  redFlags: RedFlag[];
  recommendations: string[];
  keywords: { matched: string[]; missing: string[] };
  atsScore: AtsScore | null;
}

export interface SkillGap {
  skill: string;
  priority: 'critical' | 'important' | 'nice-to-have';
  context: string;
}

export type SSEEvent =
  | { type: 'match_score'; data: { score: number; confidence: 'low' | 'medium' | 'high' } }
  | { type: 'summary'; data: string }
  | { type: 'category_scores'; data: AnalysisResult['categoryScores'] }
  | { type: 'strengths'; data: string[] }
  | { type: 'gaps'; data: SkillGap[] }
  | { type: 'recommendations'; data: string[] }
  | { type: 'keywords'; data: AnalysisResult['keywords'] }
  | { type: 'red_flags'; data: RedFlag[] }
  | { type: 'ats_score'; data: AtsScore | null }
  | { type: 'done'; data: null }
  | { type: 'error'; data: { message: string } };
```

---

## SSE Streaming Pattern

**Backend** — `POST /api/analyze` opens SSE connection and streams Claude response:

```typescript
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')

const sendEvent = (type: string, data: unknown) => {
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
}

const stream = await anthropic.messages.stream({ ... })
for await (const chunk of stream) {
  sendEvent('chunk', { text: chunk.delta?.text ?? '' })
}
sendEvent('done', null)
res.end()
```

**Frontend** — generic `useSSE` hook in `src/shared/hooks/useSSE.ts`:

- Status: `'idle' | 'connecting' | 'streaming' | 'done' | 'error'`
- Uses `EventSource` API
- Cleanup via `useEffect` return
- Typed events via discriminated union `SSEEvent`

---

## Claude Prompts

### Analysis (`apps/backend/src/prompts/analyze.prompt.ts`)

Instruct Claude to return **only** a valid JSON object matching `AnalysisResult` — no markdown, no preamble.
Include `<resume>` and `<job_posting>` XML tags wrapping the inputs.
Evaluate: technical skills match, experience level, culture fit signals, keyword overlap, seniority match, tools/stack alignment.
Detect red flags: US-only remote, mobile dev required, specific language requirement, on-site, security clearance.

Deliberately **out of scope** — do not add these back. They were removed to keep the
analysis cheap and focused on "score + what's missing": company research, salary
estimates, interview questions, skills roadmaps, ready-to-paste resume suggestions.

### Generation (`apps/backend/src/prompts/generate.prompt.ts`)

One prompt produces every artifact the user ticked, in a single Claude call, separated by
`<<<SECTION:*>>>` sentinel markers so the server can flush each one as it closes
(`apps/backend/src/lib/section-stream.ts` does the splitting).

- **Resume** — JSON. Mirrors the candidate's own section order and headings instead of a fixed
  template; facts, dates and employers are immutable; only wording, ordering and emphasis change.
  Anything the resume cannot honestly support is skipped and reported in `changeLog`.
- **Cover letter / company email / recruiter DM** — plain text, ATS-friendly, built around the
  matched keywords from the analysis. The email leads with a `Subject:` line.

---

## Zustand Store Structure

```typescript
// One store, feature slices via immer + devtools + persist
interface AppStore {
  // resume slice
  resumeText: string;
  resumeFileName: string;
  setResume: (text: string, fileName: string) => void;
  clearResume: () => void;

  // analysis slice
  currentAnalysis: AnalysisResult | null;
  streamingStatus: 'idle' | 'connecting' | 'streaming' | 'done' | 'error';
  setAnalysis: (result: AnalysisResult) => void;
  setStreamingStatus: (status: string) => void;

  // history slice (persisted)
  history: Array<{ id: string; date: string; company: string; result: AnalysisResult }>;
  addToHistory: (entry: HistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}
```

Persist only `history` slice via `partialize`.

---

## UI Requirements

- **Design**: shadcn/ui components exclusively — Button, Card, Badge, Dialog, Drawer, Tabs, Progress, Skeleton, Separator
- **Theme**: Dark mode default, Linear.app-inspired aesthetic
- **Animations**:
  - Page transitions: Framer Motion opacity + y-axis slide
  - Match score: animated counter from 0 to final value
  - Radar chart: entrance animation on mount
  - Streaming text: cursor blink while streaming
- **Loading states**: Skeleton for all async content (never spinners alone)
- **Empty states**: For history page and first-time users
- **Responsive**: desktop-primary, mobile-friendly

---

## API Endpoints

```
POST   /api/upload/resume       # multipart/form-data, returns { text, fileName }
POST   /api/analyze             # { resumeText, jobPosting } → SSE stream (score + gaps)
POST   /api/analyze/generate    # { resumeText, jobPosting, analysis, targets[], instructions }
                                #   → SSE stream, one section per requested target
POST   /api/analyze/follow-up   # post-interview email → SSE stream
POST   /api/parse-url           # LinkedIn job URL → { title, company, jobPosting }
GET    /api/health              # { status: 'ok' }
```

---

## Environment Variables

```env
# apps/backend/.env
ANTHROPIC_API_KEY=
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# apps/frontend/.env
VITE_API_URL=http://localhost:3001
```

---

## Code Style Rules

- TypeScript strict mode — no `any`, no `as` casting unless unavoidable
- All async functions wrapped in try/catch
- Zod schemas for ALL external data (API requests, API responses, env vars)
- Custom hooks for all business logic — components stay dumb
- Named exports only (no default exports except pages and router)
- Absolute imports via path aliases (`@/features/...`, `@/shared/...`)
- Co-locate tests next to source files in `__tests__` folders

---

## Testing

- **Vitest** for all unit tests
- **React Testing Library** — test behavior, not implementation
- **MSW** — mock all API calls in frontend tests
- **supertest** — integration tests for backend routes
- Test files: `ComponentName.test.tsx`, `hookName.test.ts`
- Cover: SSE hook, AnalysisResult rendering, PDF upload flow, Claude service

---

## What to Build First

1. pnpm monorepo + workspaces + docker-compose
2. Backend: Express app + health endpoint + env config
3. Backend: PDF upload endpoint + pdf-parse
4. Backend: Claude streaming service + `/api/analyze` SSE endpoint
5. Frontend: Vite + React + TS + Tailwind + shadcn/ui init
6. Frontend: Router + providers + Zustand store
7. Frontend: `useSSE` hook
8. Frontend: ResumeUploader + JobPostingForm
9. Frontend: StreamingOutput + AnalysisResult dashboard
10. Frontend: Recharts RadarChart + MatchScoreCard
11. Frontend: GeneratePanel (resume rewrite + letters)
12. Frontend: History + CompareDrawer
13. Tests + CI + Deploy
