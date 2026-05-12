import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (would use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ success: true }); // Silent fail for bots
    }

    const { email, company, role, teamSize, source } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Rate limit: 5 per hour per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const rateInfo = rateLimitMap.get(ip);

    if (rateInfo) {
      if (now < rateInfo.resetAt) {
        if (rateInfo.count >= 5) {
          return NextResponse.json(
            { error: "Too many requests. Try again later." },
            { status: 429 }
          );
        }
        rateInfo.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    }

    // Store lead (Supabase or log)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            email,
            company: company || null,
            role: role || null,
            team_size: teamSize || null,
            source: source || "audit",
            created_at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("Supabase lead storage error:", e);
      }
    } else {
      // Log to console in dev
      console.log("📧 Lead captured:", { email, company, role, teamSize, source });
    }

    // Send email via Resend (if configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Credex <noreply@credex.rocks>",
            to: [email],
            subject: "Your AI Spend Audit Results — Credex",
            html: `
              <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1a1a1a;">
                <h1 style="font-size:24px;margin-bottom:16px;">Your AI Spend Audit is Ready! 🎉</h1>
                <p>Thanks for using Credex AI Spend Audit. Your personalized results are saved and ready to review.</p>
                <p style="margin-top:24px;font-size:14px;color:#666;">
                  Have questions? Reply to this email or chat with Saver AI on our site.
                </p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                <p style="font-size:12px;color:#999;">Credex · credex.rocks · Helping Indian startups optimize AI spend</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.error("Resend email error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
