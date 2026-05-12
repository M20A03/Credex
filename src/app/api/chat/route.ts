import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], formContext, selectedAI = "claude-sonnet-4-20250514" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback FAQ response when no API key
      return NextResponse.json({
        message: getFallbackResponse(message),
      });
    }

    // Build context
    let contextStr = "";
    if (formContext?.tools?.length) {
      contextStr = `\n\nUser's current audit form has ${formContext.tools.length} tools configured with team size ${formContext.teamSize || "unknown"}.`;
    }

    const systemPrompt = `You are Saver AI, a friendly and knowledgeable assistant for Credex (credex.rocks), an AI spend optimization platform for Indian startups.

Your role:
- Help users understand their AI tool spending in Indian Rupees (₹)
- Explain audit recommendations clearly
- Compare AI tools (Cursor, GitHub Copilot, Claude, ChatGPT, Gemini, Windsurf)
- Suggest optimizations based on team size and usage

Key pricing (monthly per seat, in ₹):
- Cursor: Pro ₹1,700, Business ₹3,400
- GitHub Copilot: Individual ₹850, Business ₹1,615
- Claude: Pro ₹1,700, Max ₹2,550, Team ₹2,125
- ChatGPT: Plus ₹1,700, Team ₹2,125
- Gemini: Pro ₹1,360, Ultra ₹2,720
- Windsurf: Pro ₹1,530, Team ₹2,550

Conversion rate: ₹85/USD. Use Indian number formatting (₹1.2L = ₹1,20,000).

Be concise (max 3-4 sentences unless comparing tools). Use emojis sparingly. Be warm but professional. Always quote prices in ₹.${contextStr}`;

    const messages = [
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: selectedAI,
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage =
      data.content?.[0]?.text || "I couldn't process that. Try asking about AI tool pricing!";

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      message: "💡 I'm having trouble connecting right now. Try these popular questions: 'How do savings work?', 'Compare Cursor vs Copilot', or 'What's the catch?'",
    });
  }
}

function getFallbackResponse(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes("saving") || lower.includes("how")) {
    return "🧮 We compare what you're paying vs optimal plans for your team size. For example, if 2 devs use Copilot Business (₹1,615/seat) but Individual (₹850/seat) suffices, you save ₹1,530/mo! Every recommendation links to official pricing.";
  }
  if (lower.includes("cursor") || lower.includes("copilot")) {
    return "⚔️ **Cursor** (₹1,700/mo) — standalone editor with GPT-4 + Claude, great for deep pair-programming. **GitHub Copilot** (₹850/mo) — IDE plugin, better GitHub integration. For pure coding assistance on a budget, Copilot wins. For advanced AI features, Cursor leads.";
  }
  if (lower.includes("catch") || lower.includes("free")) {
    return "🎁 No catch — it's completely free! Credex makes money when companies use our platform to manage AI budgets at scale. The audit proves our value upfront. No signup, no credit card needed.";
  }
  if (lower.includes("example") || lower.includes("audit")) {
    return "📊 Example: Cursor Pro (2 seats = ₹3,400/mo) + Claude Team (3 seats = ₹6,375/mo) + ChatGPT Plus (1 seat = ₹1,700/mo) = ₹11,475/mo. Our audit might suggest Windsurf Pro instead + Claude Pro for solo users. Potential savings: ₹1,000+/mo!";
  }
  if (lower.includes("human") || lower.includes("talk") || lower.includes("expert")) {
    return "👋 Of course! Share your email and our Credex team will reach out within 24 hours. Or email us directly at hello@credex.rocks";
  }

  return "💡 I can help with: AI tool pricing in ₹, plan comparisons, team optimization tips, and understanding your audit results. What would you like to know?";
}
