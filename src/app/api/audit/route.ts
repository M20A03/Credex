import { NextRequest, NextResponse } from "next/server";
import { runAudit, type AuditFormData, type AuditResult } from "@/lib/audit-engine";
import { normalizeDatabaseError } from "@/lib/error-handler";

// In-memory idempotency cache for recent audit results
const idempotencyCache = new Map<string, { result: AuditResult; timestamp: number }>();

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get("x-idempotency-key");

    // Return cached response if idempotent key exists within 5 minutes
    if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
      const cached = idempotencyCache.get(idempotencyKey)!;
      if (Date.now() - cached.timestamp < 300000) {
        return NextResponse.json(cached.result, {
          headers: {
            "x-cache-status": "HIT",
            "Cache-Control": "private, no-cache",
          },
        });
      }
    }

    const body: AuditFormData = await req.json();

    // Field Validations
    if (!body.tools || !Array.isArray(body.tools) || body.tools.length === 0) {
      return NextResponse.json(
        { error: "At least one AI tool is required for audit analysis." },
        { status: 400 }
      );
    }

    if (!body.teamSize || body.teamSize < 1 || body.teamSize > 10000) {
      return NextResponse.json(
        { error: "Team size must be between 1 and 10,000." },
        { status: 400 }
      );
    }

    const validUseCases = ["coding", "writing", "research", "mixed"];
    if (!validUseCases.includes(body.useCase)) {
      return NextResponse.json(
        { error: "Invalid use case parameter." },
        { status: 400 }
      );
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    // Run deterministic audit calculation engine
    const result = runAudit(body);
    result.id = generateId();

    // Anthropic Claude Summary Enrichment (10s graceful degradation)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && result.totalCurrentMonthly > 0) {
      try {
        const prompt = `You are Credex's AI spend advisor for Indian startups. Write a ~100 word personalized summary for this audit result in a warm, professional tone. Use ₹ INR amounts.

Team: ${body.teamSize} people, use case: ${body.useCase}
Current monthly spend: ₹${result.totalCurrentMonthly.toLocaleString("en-IN")}
Potential monthly savings: ₹${result.totalMonthlySavings.toLocaleString("en-IN")} (${result.savingsPercentage}%)
Annual savings: ₹${result.totalAnnualSavings.toLocaleString("en-IN")}

Tool breakdown:
${result.recommendations
  .map(
    (r) =>
      `- ${r.toolName}: ${r.currentPlan} → ${r.recommendedPlan}, saves ₹${r.monthlySavings.toLocaleString("en-IN")}/mo. ${r.reason}`
  )
  .join("\n")}

Write as if talking directly to the founder. Start with the key insight, mention specific actions, end with encouragement. Don't use markdown headers. Use ₹ Lakh/Crore notation for large amounts (₹1.2L = ₹1,20,000).`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 250,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: AbortSignal.timeout(10000), // 10s strict timeout
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.content?.[0]?.text;
          if (aiText) {
            result.summaryText = aiText;
          }
        }
      } catch (err) {
        console.warn("Claude enrichment timed out or failed; falling back to rules summary:", err);
      }
    }

    // Cache idempotent response
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { result, timestamp: Date.now() });
      if (idempotencyCache.size > 200) {
        const oldestKey = idempotencyCache.keys().next().value;
        if (oldestKey) idempotencyCache.delete(oldestKey);
      }
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error("Audit API Error:", error);
    const normalized = normalizeDatabaseError(error);
    return NextResponse.json(
      { error: normalized.message },
      { status: normalized.statusCode }
    );
  }
}

function generateId(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
