import type { GeneratedResume } from '../../types';

/**
 * A full-length senior CV — the volume the layout is tuned for. The template is
 * expected to fit this on two pages; if a spacing change pushes it to three,
 * the accompanying test fails rather than the user finding out from a download.
 */
export const FULL_RESUME: GeneratedResume = {
  header: {
    name: 'Gregory Ypsilanti',
    title: 'Senior Frontend Developer · Vue.js Expert',
    contact:
      'Senior Remote Contractor / Full-Time Employee · Currently: Route4Me (US) · Flexible hours — can adapt to any timezone (3+ yrs of CET/EST overlap) · Open to relocation (EU/US) & remote\nname@example.com · example.github.io/portfolio · linkedin.com/in/example · github.com/example · t.me/example',
  },
  sections: [
    {
      heading: 'Summary',
      kind: 'text',
      text: 'Senior Frontend Developer with 12+ years in web development, 6+ as a frontend engineer specializing in Vue.js (Vue 2/3, Nuxt.js, Composition API, Pinia, TypeScript). Own the Customers & Locations domains at Route4Me (US) — mapping and territory-management tools used daily by thousands of logistics teams. Led the Vue 2 → 3 migration of 40+ core components. 3 years of proven remote work with a US product team; building AI-powered apps (Claude API, SSE streaming, RAG) on the side.',
    },
    {
      heading: 'Experience',
      kind: 'entries',
      entries: [
        {
          title: 'Senior Frontend Developer',
          subtitle: 'Route4Me',
          meta: 'Sep 2023 – Present · Remote · Enterprise SaaS — Route Optimization & Logistics (US) · Stack: Vue 3, TypeScript, TailwindCSS, Vite, Pinia, Google Maps API, Storybook, SCSS, Jest, Vue Test Utils, Vitest, i18n',
          bullets: [
            'Own the Customers & Locations domains — mapping and territory-management features used daily by thousands of logistics teams planning routes with 10,000+ stops.',
            'Led the Vue 2 → Vue 3 migration for 40+ core components, eliminating runtime compatibility issues and reducing technical debt.',
            'Optimized data-heavy screens: marker clustering, virtualized tables for 10k+ rows, route-based code splitting and lazy-loaded map modules — cut the main bundle by ~35% (Vite bundle analyzer, gzipped) and improved LCP from ~4.2s to ~2.1s on key dashboards (Lighthouse lab + p75 field data); map-related support tickets dropped by roughly a third the following quarter.',
            'Built and maintain territory-management and customer-assignment modules on Google Maps JS API, handling complex geospatial interactions at scale.',
            'Introduced composable architecture patterns (Composition API), improving code reuse across 5+ feature modules — average component size in the refactored domains down by roughly a third.',
            'Championed accessibility (WCAG 2.1 AA): keyboard navigation and ARIA patterns for complex map and table widgets, contrast audits in the design system.',
            'Established a testing culture: Jest + Vue Test Utils for critical components, Percy visual regression in the GitHub Actions CI pipeline, mentoring of 2 junior developers; drove SonarQube improvements — critical issues down 40% over two quarters (quality-gate reports).',
          ],
        },
        {
          title: 'Senior Frontend Developer',
          subtitle: 'Maxelium Games',
          meta: 'Feb 2023 – Aug 2023 · Remote (Oslo, Norway) · startup wound down after its investor withdrew funding · Stack: TypeScript, Vue.js, Nuxt.js, Strapi, GraphQL, PostgreSQL, Jest, Storybook',
          bullets: [
            'Architected and built a corporate marketplace and partner web apps with Vue.js / Nuxt.js and a Strapi CMS backend, consuming data via GraphQL and REST APIs.',
            'Shipped SSR on Nuxt.js for SEO-critical marketplace pages: server-side rendering with resolved hydration mismatches — ~2× faster First Contentful Paint vs the CSR baseline (Lighthouse lab runs), SEO score 95+.',
            'Designed the frontend architecture: typed API layer (TypeScript), clear module boundaries, and a shared Storybook UI kit reused across the marketplace and partner apps.',
            'Integrated Web3 wallet features (auth, transaction signing) with robust error and retry handling; wrote Jest test coverage for critical purchase flows.',
            'Modeled Strapi CMS content types together with the backend developer and wrote typed GraphQL queries and fragments for content-driven marketplace pages.',
            'Worked directly with the founders and designer in English: scoped features, estimated work, and demoed increments in weekly reviews.',
          ],
        },
        {
          title: 'Senior Frontend Developer',
          subtitle: 'Zenclass',
          meta: 'Feb 2022 – Jan 2023 · Online School Platform · project completed and delivered · Stack: Vue 2/3, Vuex, Laravel, Docker, PostgreSQL, Webpack, Storybook',
          bullets: [
            'Delivered new features and refactored legacy components in a Laravel + Vue 2/3 monolith; introduced component-level testing patterns.',
            'Drove incremental Vue 2 → Vue 3 adoption inside the monolith: extracted shared logic into composables and isolated legacy code behind typed interfaces.',
            'Built and maintained student-facing learning flows (course player, quizzes, progress tracking) used daily by thousands of students.',
            'Improved perceived performance of student-facing dashboards (code splitting, asset optimization) and ensured accessible, keyboard-navigable UI across enrollment and learning flows.',
            'Partnered with Laravel backend developers on API contracts; maintained a Dockerized dev environment for consistent onboarding.',
            'Consolidated recurring UI patterns into a shared, Storybook-documented component library reused across student and admin views.',
            'Estimated and planned frontend scope with the product owner; delivered the contracted milestones on schedule through final handover.',
          ],
        },
        {
          title: 'Middle Frontend Developer',
          subtitle: 'Lionsdigital.pro',
          meta: 'Feb 2021 – Feb 2022 · 1 yr · EdTech · product since moved to support-only mode · Stack: Vue 2, React, TypeScript, Vuex, JSON RPC, OAuth 2.0, Element UI',
          bullets: [
            'Built a multilingual student notification system; migrated auth to OAuth 2.0; launched a university schedule module serving 1,000+ students daily.',
            'Developed form-heavy admin and student interfaces on Vue 2 + TypeScript with complex validation and error handling (Element UI).',
            'Wrote typed wrappers around the JSON RPC API layer, reducing runtime errors and simplifying refactoring.',
            "Localized the platform's public and authenticated views (i18n); participated in code reviews and cross-device bug triage.",
          ],
        },
        {
          title: 'Middle Frontend Developer (Vue SPA)',
          subtitle: 'Megagroup.ru',
          meta: 'Jan 2020 – Jan 2021 · Web solutions for SMB e-commerce · Stack: Vue 2, Vuex, Vue Router, Nuxt.js, React, JavaScript, SCSS',
          bullets: [
            'Developed and maintained client-facing single-page applications on Vue 2 and React, refactoring legacy pages into a modern, reusable component architecture.',
            'Integrated Google Maps and Yandex Maps for logistics, freight, and taxi-service clients — custom routing, geocoding, and geolocation features.',
          ],
        },
        {
          title: 'Web / HTML Developer',
          subtitle: 'Megagroup.ru',
          meta: 'Dec 2013 – Dec 2019 · 6 yrs',
          bullets: [
            'Progressed from static HTML/CSS layouts to complex interactive JavaScript applications across 300+ delivered client projects (websites, landing pages, online stores), collaborating with backend developers to ship production features.',
          ],
        },
      ],
    },
    {
      heading: 'Projects',
      kind: 'entries',
      entries: [
        {
          title: 'DevJobTracker',
          subtitle: 'dev-job-tracker.vercel.app',
          meta: 'Mar 2026 – Apr 2026 · Personal — Pipeline tracker with Kanban board · Stack: Nuxt 3, TypeScript, Pinia, Supabase (PostgreSQL + Auth + Realtime), TailwindCSS, Vitest, Vercel',
          bullets: [
            'Built production-ready Kanban app with 5-column pipeline (Wishlist → Offer), drag-and-drop with optimistic updates and rollback on DB error.',
            'Implemented GitHub OAuth 2.0 via Supabase Auth with Row-Level Security — data isolation enforced at DB level, zero manual user filtering in queries.',
            'Added real-time sync via Supabase postgres_changes subscriptions; deadline tracking with color-coded urgency badges and analytics dashboard with conversion funnel.',
          ],
        },
        {
          title: 'Route Planner AI',
          subtitle: 'route-ai-nine.vercel.app',
          meta: 'Aug 2025 – Present · Personal — AI-powered route planning app · Stack: Vue 3.5, TypeScript 5.8, Vuetify 3, Pinia, Vite 6, Google Maps API, Claude API',
          bullets: [
            'Built multi-stop route planner with AI assistant (Claude API) providing real-time optimization suggestions via SSE streaming.',
            'Implemented Google Places Autocomplete, drag-and-drop waypoint reordering, map marker dragging with auto reverse-geocoding.',
            'Designed shareable link system encoding full route state in URL; achieved <2s initial load with Vite code splitting.',
          ],
        },
        {
          title: 'AI Assistant Platform',
          subtitle: 'ai-front-puce.vercel.app',
          meta: 'Aug 2025 – Feb 2026 · Personal — Full-stack AI assistant with RAG · Stack: Vue 3, TypeScript, Express, LangChain, Claude API, HNSWLib + OpenAI Embeddings',
          bullets: [
            'Built end-to-end AI assistant platform with SSE streaming, RAG pipeline for document understanding, and structured code review.',
            'Implemented the RAG pipeline end-to-end: document chunking, OpenAI embeddings, and HNSWLib vector search via LangChain.',
          ],
        },
      ],
    },
    {
      heading: 'Technical Skills',
      kind: 'bullets',
      bullets: [
        'Frontend: Vue 2/3, Composition API, Nuxt.js (SSR), Pinia, Vuex, React (2 yrs)',
        'Languages: TypeScript (5+ yrs), JavaScript ES6+, HTML5, CSS3/SCSS',
        'Performance: Core Web Vitals (LCP / CLS / INP), code splitting, lazy loading, list virtualization, bundle analysis, Lighthouse',
        'Build Tools: Vite, Webpack, pnpm',
        'UI Libraries: TailwindCSS, Vuetify, Element UI',
        'Backend / DB: Supabase (PostgreSQL + Auth + Realtime), Express, Node.js',
        'APIs: Google Maps JS API, Claude API (Anthropic), GraphQL, Pusher/WebSocket, REST, JSON RPC',
        'Testing & QA: Jest, Vitest, Vue Test Utils, Percy, SonarQube, Storybook',
        'i18n & a11y: Localization, WCAG 2.1 AA, responsive & cross-browser UI',
        'DevOps & Tools: Git, GitHub Actions, Docker, CI/CD, Vercel, Agile, Scrum',
      ],
    },
    {
      heading: 'Education',
      kind: 'text',
      text: "Fergana Polytechnic Institute · Bachelor's degree in Engineering · 2013–2017. Self-taught software developer since 2013; transitioned to full-time frontend development by 2020.",
    },
    {
      heading: 'Languages',
      kind: 'text',
      text: 'English — B2, daily working language for 3+ years (standups, code reviews, documentation) · Russian — Native · Uzbek — Native',
    },
  ],
  changeLog: [],
};
