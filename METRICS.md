# Metrics — Credex AI Spend Audit

## North Star Metric
**Audits Completed per Week** — measures both acquisition and activation in one number. An audit is "completed" when the user reaches the results dashboard (not just form load). This is the clearest signal that we delivered value.

## Input Metrics (Leading Indicators)

| Metric | Target (Month 1) | How Measured |
|--------|-----------------|--------------|
| Form starts | 500/week | PostHog `form_start` event |
| Audits completed | 150/week (30% conversion) | PostHog `audit_completed` event |
| Email captures | 20/week (13% of audits) | Supabase `leads` table |
| Chatbot opens | 40% of visitors | PostHog `chatbot_opened` event |
| Results shared | 8% of audits | PostHog `results_shared` event |
| Returning users | 15% of audits | PostHog session analysis |

## Instrumentation Plan

```typescript
// Key events to track in PostHog:
posthog.capture('form_start')
posthog.capture('tool_added', { toolId, planId, seats })
posthog.capture('audit_submitted', { toolCount, teamSize, useCase })
posthog.capture('audit_completed', { totalSavings, savingsPercentage })
posthog.capture('email_captured', { source: 'form' | 'modal' | 'chatbot' })
posthog.capture('results_shared', { method: 'copy' | 'native' })
posthog.capture('chatbot_opened')
posthog.capture('chatbot_message_sent')
posthog.capture('quick_reply_clicked', { reply })
posthog.capture('tool_card_expanded', { toolId, severity })
```

## Pivot Triggers

**Pivot 1 — If audit-to-email conversion < 5% after 2 weeks:**
The results are not believable or savings are too small. Intervention: show testimonials, add source URL citations directly in UI, lower threshold for "meaningful savings" display.

**Pivot 2 — If form completion < 20% of form starts:**
The form is too complex. Intervention: reduce to 3 fields (tool, plan, seats) — remove team size and use case from the initial form.

**Pivot 3 — If chatbot engagement < 15% of visitors:**
The floating orb isn't visible enough. Intervention: add a slide-up chat bubble after 10 seconds with a specific message ("Found ₹24,000 potential savings for your team size — want details?").

## Weekly Review Cadence
Every Monday: review North Star + 3 input metrics in PostHog dashboard. Any metric 20% below target triggers an immediate experiment.
