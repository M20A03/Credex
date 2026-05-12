import { NextRequest, NextResponse } from "next/server";
import { runAudit, type AuditFormData } from "@/lib/audit-engine";

export async function POST(req: NextRequest) {
  try {
    const body: AuditFormData = await req.json();

    // Validate
    if (!body.tools || !Array.isArray(body.tools) || body.tools.length === 0) {
      return NextResponse.json(
        { error: "At least one tool is required" },
        { status: 400 }
      );
    }

    // Validate team size
    if (!body.teamSize || body.teamSize < 1 || body.teamSize > 10000) {
      return NextResponse.json(
        { error: "Team size must be between 1 and 10000" },
        { status: 400 }
      );
    }

    // Validate use case
    const validUseCases = ["coding", "writing", "research", "mixed"];
    if (!validUseCases.includes(body.useCase)) {
      return NextResponse.json(
        { error: "Invalid use case" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Run the audit engine
    const result = runAudit(body);

    // Try to get AI summary from Claude
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
            model: "claude-sonnet-4-20250514",
            max_tokens: 200,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.content?.[0]?.text;
          if (aiText) {
            result.summaryText = aiText;
          }
        } else {
          console.warn("Claude API non-200 response:", response.status);
        }
      } catch (e) {
        console.error("Claude summary error:", e);
        // Keep fallback summary from audit engine
      }
    }

    // Generate a unique ID for shareable URL
    result.id = generateId();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Audit API error:", error);
    const errorMessage = error instanceof SyntaxError ? "Invalid JSON format" : "Failed to process audit";
    return NextResponse.json(
      { error: errorMessage },
      { status: error instanceof SyntaxError ? 400 : 500 }
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
