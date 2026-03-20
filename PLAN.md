# Development Plan

> Update checkboxes as work progresses. Current phase is the first uncompleted one.

## Phase 1 — Monorepo Infrastructure

- [x] pnpm workspaces + `pnpm-workspace.yaml`
- [x] `packages/shared` — TypeScript types (`AnalysisResult`, `SkillGap`, `SSEEvent`)
- [x] `docker-compose.yml` with frontend + backend services
- [x] ESLint (airbnb-typescript) + Prettier + Husky + lint-staged
- [x] GitHub Actions CI (lint + build)

## Phase 2 — Backend: Foundation

- [x] Express 5 + TypeScript (ESM) + `apps/backend` structure
- [x] `config/env.ts` — envalid env variable validation
- [x] Middleware: helmet, cors, morgan, error handler
- [x] `GET /api/health`
- [x] Zod middleware for request validation

## Phase 3 — Backend: PDF Upload

- [x] multer middleware
- [x] `pdf.service.ts` — pdf-parse text extraction
- [x] `POST /api/upload/resume` — multipart/form-data → `{ text, fileName }`
- [x] Zod schemas for upload request/response

## Phase 4 — Backend: Claude Streaming

- [x] `claude.service.ts` — Anthropic SDK, streaming enabled
- [x] `analyze.prompt.ts` — prompt with `<resume>` + `<job_posting>` XML tags
- [x] `coverletter.prompt.ts` — cover letter prompt
- [x] `POST /api/analyze` — SSE stream (`sendEvent` pattern)
- [x] `POST /api/cover-letter` — SSE stream

## Phase 5 — Frontend: Foundation

- [x] Vite 5 + React 18 + TypeScript strict + Tailwind CSS v3
- [x] shadcn/ui init (dark theme, Linear-inspired)
- [x] Path aliases (`@/features/...`, `@/shared/...`)
- [x] `providers.tsx` — QueryClient + Toaster + ThemeProvider
- [x] `router.tsx` — React Router v6 data router, 4 pages (stubs)

## Phase 6 — Frontend: State + SSE Hook

- [x] `store.ts` — Zustand with immer + devtools + persist (history slice only)
- [x] `useSSE.ts` — generic hook: statuses `idle/connecting/streaming/done/error`, typed `SSEEvent`
- [x] `api-client.ts`, `query-client.ts`, `cn()` utilities
- [x] Layout + Sidebar + ThemeToggle + ErrorBoundary

## Phase 7 — Frontend: Resume Upload

- [x] `ResumeUploader` — react-dropzone, drag & drop PDF
- [x] `ResumePreview` — pdfjs-dist in-browser preview
- [x] `useResumeStore` hook (Zustand slice)
- [x] `AnalysisForm` + React Hook Form v7 + Zod validation
- [x] `AnalyzePage.tsx` wires everything together

## Phase 8 — Frontend: Streaming Analysis UI

- [x] `useStreamAnalysis` — calls `/api/analyze`, handles SSE events
- [x] `StreamingOutput` — blinking cursor while streaming
- [x] `MatchScoreCard` — animated counter 0 → N (Framer Motion)
- [x] `SkillRadarChart` — Recharts RadarChart with entrance animation
- [x] `SkillGapList` — priorities: critical / important / nice-to-have
- [x] `AnalysisResult` dashboard — Skeleton for loading states

## Phase 9 — Frontend: Cover Letter + History

- [x] `CoverLetterPanel` — `useStreamAnalysis` for `/api/cover-letter`, SSE text streaming
- [x] `HistoryPage` — list with empty state for first-time users
- [x] `HistoryList` / `HistoryItem` — past analysis cards
- [x] `CompareDrawer` — side-by-side comparison of two results (`ComparePage`)
- [x] `useAnalysisHistory` hook, `addToHistory` on analysis completion

## Phase 10 — Tests + CI + Deploy

- [ ] Vitest unit tests: `useSSE`, `useStreamAnalysis`, `AnalysisResult`, `pdf.service`
- [ ] React Testing Library: `ResumeUploader`, `MatchScoreCard`, `SkillGapList`
- [ ] MSW mocks for all API calls in frontend tests
- [ ] supertest integration tests: `/api/health`, `/api/upload/resume`, `/api/analyze`
- [ ] GitHub Actions: lint + test + build pipeline
- [ ] Deploy: Vercel (frontend) + Railway (backend)

---

**Critical path:** Phase 1 → 2 → 3 → 4 (backend ready) → 5 → 6 → 7 → 8 (core feature done) → 9 → 10
