import type { Metadata } from "next";
import { inter, spaceGrotesk } from "./fonts";
import { ThemeProvider, themeInitScript } from "@/components/theme/ThemeProvider";
import ToastContainer from "@/components/ToastContainer";
import CustomCursor from "@/components/effects/CustomCursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credex AI Spend Audit — Optimize Your AI Tool Budget in ₹",
  description:
    "Free AI spend audit tool for Indian startups. Enter your AI tools, get instant optimization recommendations in ₹. Stop overpaying for Cursor, GitHub Copilot, Claude, ChatGPT, and more.",
  keywords: [
    "AI tools audit",
    "AI spend optimization",
    "Indian rupee AI pricing",
    "Cursor pricing India",
    "GitHub Copilot cost India",
  ],
  openGraph: {
    title: "Credex AI Spend Audit",
    description: "Discover how much you're overpaying on AI tools. Free audit in ₹.",
    url: "https://credex.rocks",
    siteName: "Credex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Credex AI Spend Audit",
    description: "Discover how much you're overpaying on AI tools. Free audit in ₹.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          {/* Liquid background blobs */}
          <div className="liquid-bg" aria-hidden="true">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
            <div className="blob blob-4" />
          </div>

          {/* Custom cursor (desktop only) */}
          <div id="cursor-dot" aria-hidden="true" />
          <div id="cursor-ring" aria-hidden="true" />

          {/* Global Toast & Cursor Effects */}
          <CustomCursor />
          <ToastContainer />

          {/* Main App Content */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
