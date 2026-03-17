# Development Plan

> Update checkboxes as work progresses. Current phase is the first uncompleted one.

## Phase 1 — Monorepo Infrastructure
- [ ] pnpm workspaces + `pnpm-workspace.yaml`
- [ ] `packages/shared` — TypeScript types (`AnalysisResult`, `SkillGap`, `SSEEvent`)
- [ ] `docker-compose.yml` with frontend + backend services
- [ ] ESLint (airbnb-typescript) + Prettier + Husky + lint-staged
- [ ] GitHub Actions CI (lint + build)

## Phase 2 — Backend: Foundation
- [ ] Express 5 + TypeScript (ESM) + `apps/backend` structure
- [ ] `config/env.ts` — envalid env variable validation
- [ ] Middleware: helmet, cors, morgan, error handler
- [ ] `GET /api/health`
- [ ] Zod middleware for request validation

## Phase 3 — Backend: PDF Upload
- [ ] multer middleware
- [ ] `pdf.service.ts` — pdf-parse text extraction
- [ ] `POST /api/upload/resume` — multipart/form-data → `{ text, fileName }`
- [ ] Zod schemas for upload request/response

## Phase 4 — Backend: Claude Streaming
- [ ] `claude.service.ts` — Anthropic SDK, streaming enabled
- [ ] `analyze.prompt.ts` — prompt with `<resume>` + `<job_posting>` XML tags
- [ ] `coverletter.prompt.ts` — cover letter prompt
- [ ] `POST /api/analyze` — SSE stream (`sendEvent` pattern)
- [ ] `POST /api/cover-letter` — SSE stream

## Phase 5 — Frontend: Foundation
- [ ] Vite 5 + React 18 + TypeScript strict + Tailwind CSS v3
- [ ] shadcn/ui init (dark theme, Linear-inspired)
- [ ] Path aliases (`@/features/...`, `@/shared/...`)
- [ ] `providers.tsx` — QueryClient + Toaster + ThemeProvider
- [ ] `router.tsx` — React Router v6 data router, 4 pages (stubs)

## Phase 6 — Frontend: State + SSE Hook
- [ ] `store.ts` — Zustand with immer + devtools + persist (history slice only)
- [ ] `useSSE.ts` — generic hook: statuses `idle/connecting/streaming/done/error`, typed `SSEEvent`
- [ ] `api-client.ts`, `query-client.ts`, `cn()` utilities
- [ ] Layout + Sidebar + ThemeToggle + ErrorBoundary

## Phase 7 — Frontend: Resume Upload
- [ ] `ResumeUploader` — react-dropzone, drag & drop PDF
- [ ] `ResumePreview` — pdfjs-dist in-browser preview
- [ ] `useResumeStore` hook (Zustand slice)
- [ ] `AnalysisForm` + React Hook Form v7 + Zod validation
- [ ] `AnalyzePage.tsx` wires everything together

## Phase 8 — Frontend: Streaming Analysis UI
- [ ] `useStreamAnalysis` — calls `/api/analyze`, handles SSE events
- [ ] `StreamingOutput` — blinking cursor while streaming
- [ ] `MatchScoreCard` — animated counter 0 → N (Framer Motion)
- [ ] `SkillRadarChart` — Recharts RadarChart with entrance animation
- [ ] `SkillGapList` — priorities: critical / important / nice-to-have
- [ ] `AnalysisResult` dashboard — Skeleton for loading states

## Phase 9 — Frontend: Cover Letter + History
- [ ] `CoverLetterPanel` — `useStreamAnalysis` for `/api/cover-letter`, SSE text streaming
- [ ] `HistoryPage` — list with empty state for first-time users
- [ ] `HistoryList` / `HistoryItem` — past analysis cards
- [ ] `CompareDrawer` — side-by-side comparison of two results (`ComparePage`)
- [ ] `useAnalysisHistory` hook, `addToHistory` on analysis completion

## Phase 10 — Tests + CI + Deploy
- [ ] Vitest unit tests: `useSSE`, `useStreamAnalysis`, `AnalysisResult`, `pdf.service`
- [ ] React Testing Library: `ResumeUploader`, `MatchScoreCard`, `SkillGapList`
- [ ] MSW mocks for all API calls in frontend tests
- [ ] supertest integration tests: `/api/health`, `/api/upload/resume`, `/api/analyze`
- [ ] GitHub Actions: lint + test + build pipeline
- [ ] Deploy: Vercel (frontend) + Railway (backend)

---

**Critical path:** Phase 1 → 2 → 3 → 4 (backend ready) → 5 → 6 → 7 → 8 (core feature done) → 9 → 10
