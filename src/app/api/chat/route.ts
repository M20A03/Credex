import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let userMessage = "";
  try {
    const body = await req.json();
    const { message, history = [], formContext, selectedAI = "claude-3-7-sonnet-20250219" } = body;
    userMessage = typeof message === "string" ? message : "";

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid message: message is required and must be non-empty" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const sanitizedMessage = message.trim().substring(0, 5000);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        message: getFallbackResponse(message),
      });
    }

    // Build context
    let contextStr = "";
    if (formContext?.tools?.length) {
      contextStr = `\n\nUser's current audit form has ${formContext.tools.length} tools configured with team size ${formContext.teamSize || "unknown"}.`;
    }

    const systemPrompt = `You are Saver AI, an expert AI FinTech and spend optimization advisor for Credex (credex.rocks).
You help Indian startups and engineering leaders eliminate AI software license waste across Cursor, Copilot, Claude, ChatGPT, Gemini, Windsurf, Perplexity, and v0.

Current 2026 SaaS Pricing Reference:
- Cursor IDE: Free, Pro (₹1,700/mo or $20), Business (₹3,400/mo or $40)
- GitHub Copilot: Free, Individual (₹850/mo or $10), Business (₹1,615/mo or $19)
- Claude: Free, Pro (₹1,700/mo or $20), Team (₹2,125/mo or $25)
- ChatGPT: Free, Plus (₹1,700/mo or $20), Team (₹2,125/mo or $25)
- Windsurf: Free, Pro (₹1,275/mo or $15), Team (₹2,125/mo or $25)
- Gemini: Free, Advanced Pro (₹1,700/mo or $20)
- Perplexity: Free, Pro (₹1,700/mo or $20)

Conversion standard: ₹85 = $1 USD.
Always give concise, actionable answers in ₹ INR and $ USD. Maintain a sharp, executive tone.${contextStr}`;

    const messages = [
      ...history.slice(-6),
      { role: "user" as const, content: sanitizedMessage },
    ];

    // Map model ID to supported Anthropic endpoint
    const modelToUse =
      selectedAI.startsWith("claude") ? selectedAI : "claude-3-7-sonnet-20250219";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelToUse,
        max_tokens: 350,
        system: systemPrompt,
        messages,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API status: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage =
      data.content?.[0]?.text || "I couldn't generate a response. Ask about AI tool pricing!";

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        message: getFallbackResponse(userMessage),
      },
      { status: 200 }
    );
  }
}

function getFallbackResponse(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes("saving") || lower.includes("how")) {
    return "🧮 We analyze your active team size against plan feature requirements. For example, moving 5 developers from Copilot Business (₹1,615/mo) to Individual (₹850/mo) recovers ₹3,825/mo (₹45,900/year) with zero developer friction!";
  }
  if (lower.includes("cursor") || lower.includes("copilot") || lower.includes("windsurf")) {
    return "⚔️ **Cursor** (₹1,700/mo) is top for multi-file autonomous edits. **GitHub Copilot** (₹850/mo) is the budget champion for IDE autocompletion. **Windsurf** (₹1,275/mo) provides Cascade flows at 25% lower cost than Cursor!";
  }
  if (lower.includes("catch") || lower.includes("free")) {
    return "🎁 100% free with no credit card required. Credex offers instant audits to help Indian engineering teams right-size their budgets upfront.";
  }
  if (lower.includes("human") || lower.includes("expert") || lower.includes("talk")) {
    return "👋 Happy to help! Leave your email below or reach us directly at hello@credex.rocks to discuss custom contract renegotiations.";
  }

  return "💡 Saver AI is ready. You can ask: 'Compare Cursor vs Windsurf', 'How much can a 10-dev team save?', or 'Which plan do I need for Claude?'";
}
