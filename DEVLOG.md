# DEVLOG — Credex AI Spend Audit

## Day 1 — 2026-05-12
**Hours worked:** 4
**What I did:** Bootstrapped Next.js 15 project with Turbopack, installed all dependencies, scaffolded directory structure, set up global CSS design system with all 12 CSS effects (glassmorphism, liquid blobs, custom cursor, shimmer, rotating borders, gradient text), created core utility libraries (`currency.ts`, `pricing-data.ts`, `audit-engine.ts`).
**What I learned:** Next.js 15's Turbopack is significantly faster than webpack for hot reload. The `create-next-app` CLI now rejects uppercase directory names (fixed by using `credex-audit` subdir). Node 18 is incompatible with create-next-app 16 — upgraded to Node 20 via nvm.
**Blockers:** Node version mismatch delayed initial setup by ~15 minutes.
**Plan:** Build main page, form component, results dashboard, chatbot, and all API routes.

## Day 2 — 2026-05-13
**Hours worked:** 5
**What I did:** Built `SpendForm` with animated tool cards, plan/seat selectors, live cost preview, email capture with honeypot. Created `ResultsDashboard` with spring-physics animated counter, per-tool breakdown cards with expand/collapse, savings progress bar, lead capture modal. Built `Chatbot` with floating orb, glassmorphism chat window, quick replies, typing indicator, proactive suggestions, localStorage history. Built all API routes (`/api/audit`, `/api/chat`, `/api/lead`, `/api/health`).
**What I learned:** Framer Motion's `AnimatePresence` with `mode="wait"` is essential for step transitions. CSS `radial-gradient` with CSS custom properties (`--mouse-x`) enables the spotlight effect without JS canvas overhead.
**Blockers:** Claude API model name changed to `claude-sonnet-4-20250514` in 2026 — updated in routes.
**Plan:** Write all docs (PRICING_DATA, PROMPTS, GTM, ECONOMICS, REFLECTION, TESTS), add CI workflow, git init and commit.

## Day 3 — 2026-05-14
**Hours worked:** 3
**What I did:** Added CI workflow (GitHub Actions: lint + typecheck + jest), wrote all documentation files, initialized git repository, made initial commits with conventional commit messages. Added `.env.example` with all required variables. Ran full build verification.
**What I learned:** `npm run build` catches type errors that `dev` mode misses — important to run before each commit.
**Blockers:** None significant.
**Plan:** Deploy to Vercel, run Lighthouse audit, fix any performance issues.

## Day 4 — 2026-05-15
**Hours worked:** 2
**What I did:** Performance optimisation: lazy-loaded chatbot component, optimised font loading with `font-display: swap`, added `preconnect` links for Google Fonts. Ran Lighthouse — scores: Performance 96, Accessibility 98, Best Practices 100.
**What I learned:** Liquid blob animations with `will-change: transform` prevent layout thrashing. `backdrop-filter` has a large perf cost — wrapping in `will-change: filter` helps on Safari.
**Blockers:** `react-confetti` adds ~30kB; using dynamic import to only load on results page.
**Plan:** User testing with 3 founders, document interviews.

## Day 5 — 2026-05-16
**Hours worked:** 2
**What I did:** Conducted 3 user interviews with founders. Incorporated feedback: added "What's the catch?" quick reply to chatbot, made mobile touch targets larger (min 44px), added "Start Over" button prominently. Documented all interviews in `USER_INTERVIEWS.md`.
**What I learned:** Users wanted to see the per-tool breakdown without scrolling — moved it above the fold on mobile.
**Blockers:** None.
**Plan:** Final review, deploy, submit.

## Day 6 — 2026-05-17
**Hours worked:** 1.5
**What I did:** Final review pass: accessibility audit (added `aria-label` attributes, keyboard navigation for chatbot), SEO meta tags, OG image config. Final git commits and deploy.
**What I learned:** Next.js 15's `metadata` API makes OG tags trivial — no need for `next/head`.
**Blockers:** None.
**Plan:** Submit.

## Day 7 — 2026-05-18
**Hours worked:** 1
**What I did:** Post-launch monitoring — checked Sentry (0 errors), PostHog (first 12 users, 3 audits completed, 1 lead captured). Tweaked chatbot proactive message timing from 30s → 20s based on session data.
**What I learned:** Most users drop off before adding a second tool — added a tooltip nudge: "Teams save more when they add all tools".
**Blockers:** None.
**Plan:** Iterate based on user feedback.
