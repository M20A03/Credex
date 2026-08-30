import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "twitterbot",
  "facebookexternalhit",
  "linkedinbot",
  "slackbot",
  "whatsapp",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, next internal files, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 1. Geo-Detection & Currency Context
  const country =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "IN"; // Default to India for Credex
  
  const currency = country.toUpperCase() === "IN" ? "INR" : "USD";
  response.headers.set("x-geo-country", country);
  response.headers.set("x-currency-preference", currency);

  // 2. Bot Detection
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));
  response.headers.set("x-is-bot", isBot ? "1" : "0");

  // 3. A/B Testing Variant Cookie
  const abCookie = request.cookies.get("credex_ab_variant");
  if (!abCookie) {
    const assignedVariant = Math.random() < 0.5 ? "variant_a" : "variant_b";
    response.cookies.set("credex_ab_variant", assignedVariant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });
  }

  // 4. SRE Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
