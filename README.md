# Credex AI Spend Audit — README

**Stop overpaying for AI tools.** Free, instant spend audit for Indian startups in ₹.

## Quick Start
```bash
cd ~/Desktop/Credex/credex-audit
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY, SUPABASE credentials, RESEND_API_KEY
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## Features
- 🧮 Real-time savings calculator (₹ INR with lakh/crore notation)
- 💬 Saver AI chatbot (floating orb → glass chat window)
- 📊 Animated results dashboard (spring-physics number ticker)
- 🔒 Lead capture with rate-limiting + honeypot
- 📱 Fully responsive (320px → 1600px+)
- ✨ 12+ premium CSS effects (glassmorphism, liquid bg, custom cursor, etc.)

## Architecture Decisions (5 Trade-offs)
1. **CSS-first animations over Framer Motion for backgrounds** — Blob animations use pure CSS keyframes to avoid JS overhead on the main thread; Framer Motion reserved for component transitions.
2. **Zustand over Redux** — Much lighter (< 1kB), simpler API, built-in persistence middleware; Redux adds unnecessary boilerplate for single-page state.
3. **API-less audit engine** — Core `audit-engine.ts` is pure TypeScript with no external calls, making it instantly testable and offline-capable. Claude enriches but doesn't gate the output.
4. **Graceful degradation** — Every external integration (Supabase, Resend, Claude) has a fallback path so the app works fully without any API keys in dev.
5. **Pricing data as TS constants, not a DB** — Tool prices rarely change; static `pricing-data.ts` allows zero-latency lookups and easy version-controlled updates.

## Environment Variables
See `.env.example` for all required variables.

## License
MIT
