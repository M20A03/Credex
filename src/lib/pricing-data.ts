export type Plan = {
  id: string;
  name: string;
  pricePerSeat: number; // monthly in ₹
  pricePerSeatUSD: number; // monthly in $
  description: string;
  popular?: boolean;
  features?: string[];
};

export type Tool = {
  id: string;
  name: string;
  category: 'coding' | 'writing' | 'research' | 'design' | 'general';
  logo: string;
  color: string;
  badge?: string;
  plans: Plan[];
  sourceUrl: string;
  lastUpdated: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'cursor',
    name: 'Cursor IDE',
    category: 'coding',
    logo: '🖱️',
    color: '#8B5CF6',
    badge: 'Trending Editor',
    plans: [
      { id: 'free', name: 'Hobby Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: '2,000 completions + 50 slow premium requests' },
      { id: 'pro', name: 'Pro Individual', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '500 fast Claude 3.7 / GPT-4o requests + unlimited completions', popular: true },
      { id: 'business', name: 'Business Team', pricePerSeat: 3400, pricePerSeatUSD: 40, description: 'Centralized admin billing + zero data retention privacy' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 6800, pricePerSeatUSD: 80, description: 'SSO (SAML/Okta) + SOC2 compliance + dedicated support' },
    ],
    sourceUrl: 'https://cursor.com/pricing',
    lastUpdated: '2026-06',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    logo: '🐙',
    color: '#3B82F6',
    badge: 'Enterprise Standard',
    plans: [
      { id: 'free', name: 'Copilot Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: '2,000 code completions/mo in VS Code' },
      { id: 'individual', name: 'Individual', pricePerSeat: 850, pricePerSeatUSD: 10, description: 'Unlimited completions + multi-turn chat in IDE', popular: true },
      { id: 'business', name: 'Business', pricePerSeat: 1615, pricePerSeatUSD: 19, description: 'Organization license management + PR summaries & CLI' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 3315, pricePerSeatUSD: 39, description: 'Custom fine-tuned internal models & codebase search' },
    ],
    sourceUrl: 'https://github.com/features/copilot/pricing',
    lastUpdated: '2026-06',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    category: 'general',
    logo: '🧠',
    color: '#F59E0B',
    badge: 'Top Reasoning',
    plans: [
      { id: 'free', name: 'Free Tier', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Claude 3.5 Sonnet with standard rate limits' },
      { id: 'pro', name: 'Pro Plan', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '5× higher usage limit + Claude 3.7 Sonnet hybrid reasoning', popular: true },
      { id: 'team', name: 'Team Plan', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Admin console, user management, and shared project knowledge (min 5 seats)' },
      { id: 'max', name: 'Claude Max (Heavy)', pricePerSeat: 2550, pricePerSeatUSD: 30, description: 'Maximum rate limits for power engineering users' },
    ],
    sourceUrl: 'https://anthropic.com/pricing',
    lastUpdated: '2026-06',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (OpenAI)',
    category: 'general',
    logo: '💬',
    color: '#10B981',
    badge: 'Most Adopted',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'GPT-4o mini with standard capacity' },
      { id: 'plus', name: 'Plus Individual', pricePerSeat: 1700, pricePerSeatUSD: 20, description: 'Full access to GPT-4o, o1, o3-mini, Canvas & Advanced Voice', popular: true },
      { id: 'team', name: 'Team Workspace', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Workspace data excluded from model training + admin console' },
      { id: 'enterprise', name: 'Enterprise Custom', pricePerSeat: 5100, pricePerSeatUSD: 60, description: 'Unlimited high-speed reasoning + custom GPT deployment' },
    ],
    sourceUrl: 'https://openai.com/chatgpt/pricing',
    lastUpdated: '2026-06',
  },
  {
    id: 'windsurf',
    name: 'Windsurf (Codeium)',
    category: 'coding',
    logo: '🌊',
    color: '#06B6D4',
    badge: 'Best Value Pick',
    plans: [
      { id: 'free', name: 'Community Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Standard completions & limited Cascade agent flows' },
      { id: 'pro', name: 'Windsurf Pro', pricePerSeat: 1275, pricePerSeatUSD: 15, description: 'Unlimited Cascade agent flows + deep repo context indexing', popular: true },
      { id: 'team', name: 'Team Plan', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Multi-seat team dashboard + centralized billing' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 4250, pricePerSeatUSD: 50, description: 'Self-hosted / VPC deployment + SOC2 + SLA' },
    ],
    sourceUrl: 'https://codeium.com/windsurf',
    lastUpdated: '2026-06',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    category: 'general',
    logo: '✨',
    color: '#38BDF8',
    badge: '2M Token Context',
    plans: [
      { id: 'free', name: 'Standard Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Gemini 2.0 Flash' },
      { id: 'pro', name: 'Advanced Pro (AI Premium)', pricePerSeat: 1700, pricePerSeatUSD: 20, description: 'Gemini 2.0 Pro with 2M token context window + 2TB Google Drive', popular: true },
      { id: 'workspace', name: 'Workspace Business', pricePerSeat: 1700, pricePerSeatUSD: 20, description: 'Integrated directly into Gmail, Docs, Sheets & Meet' },
      { id: 'enterprise', name: 'Workspace Enterprise', pricePerSeat: 2550, pricePerSeatUSD: 30, description: 'Enterprise-grade data security & administrative auditing' },
    ],
    sourceUrl: 'https://gemini.google.com',
    lastUpdated: '2026-06',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    category: 'research',
    logo: '🔍',
    color: '#6366F1',
    badge: 'Research Search',
    plans: [
      { id: 'free', name: 'Free Search', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Standard quick search queries' },
      { id: 'pro', name: 'Pro Search', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '300+ Pro searches/day with Claude 3.7 & DeepSeek R1', popular: true },
      { id: 'enterprise', name: 'Enterprise Pro', pricePerSeat: 3400, pricePerSeatUSD: 40, description: 'Internal workspace document search + team user management' },
    ],
    sourceUrl: 'https://perplexity.ai/pro',
    lastUpdated: '2026-06',
  },
  {
    id: 'v0',
    name: 'v0 by Vercel',
    category: 'design',
    logo: '▲',
    color: '#EC4899',
    badge: 'UI Generation',
    plans: [
      { id: 'free', name: 'Free Credits', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Basic generation credits' },
      { id: 'premium', name: 'Premium Individual', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '5,000 monthly credits + full React/Tailwind code export', popular: true },
      { id: 'team', name: 'Team Workspace', pricePerSeat: 2550, pricePerSeatUSD: 30, description: 'Shared team component libraries & private design registries' },
    ],
    sourceUrl: 'https://v0.dev',
    lastUpdated: '2026-06',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'design',
    logo: '🎨',
    color: '#E11D48',
    badge: 'AI Visuals',
    plans: [
      { id: 'basic', name: 'Basic Plan', pricePerSeat: 850, pricePerSeatUSD: 10, description: '3.3 hr/mo Fast GPU time (~200 images)' },
      { id: 'standard', name: 'Standard Plan', pricePerSeat: 2550, pricePerSeatUSD: 30, description: '15 hr/mo Fast GPU time + unlimited Relax GPU', popular: true },
      { id: 'pro', name: 'Pro Plan', pricePerSeat: 5100, pricePerSeatUSD: 60, description: '30 hr/mo Fast GPU time + Stealth mode' },
    ],
    sourceUrl: 'https://docs.midjourney.com/docs/plans',
    lastUpdated: '2026-06',
  },
];

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}

export function getPlanById(toolId: string, planId: string): Plan | undefined {
  const tool = getToolById(toolId);
  return tool?.plans.find((p) => p.id === planId);
}

export function getAlternatives(toolId: string): Tool[] {
  const tool = getToolById(toolId);
  if (!tool) return [];
  return TOOLS.filter((t) => t.id !== toolId && (t.category === tool.category || (t.category === 'coding' && tool.category === 'coding')));
}
