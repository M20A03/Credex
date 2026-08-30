export type Plan = {
  id: string;
  name: string;
  pricePerSeat: number; // monthly in ₹
  pricePerSeatUSD: number; // monthly in $
  description: string;
  popular?: boolean;
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
      { id: 'free', name: 'Free Hobby', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Limited completions' },
      { id: 'pro', name: 'Pro Individual', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '500 fast premium requests/mo', popular: true },
      { id: 'business', name: 'Business Team', pricePerSeat: 3400, pricePerSeatUSD: 40, description: 'Centralized billing + zero data retention' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 6800, pricePerSeatUSD: 80, description: 'Custom model routers + SSO & audit logs' },
    ],
    sourceUrl: 'https://cursor.com/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    logo: '🐙',
    color: '#3B82F6',
    badge: 'Enterprise Standard',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: '2,000 code completions/mo' },
      { id: 'individual', name: 'Individual', pricePerSeat: 850, pricePerSeatUSD: 10, description: 'Unlimited IDE completions in VS Code / JetBrains', popular: true },
      { id: 'business', name: 'Business', pricePerSeat: 1615, pricePerSeatUSD: 19, description: 'Organization policy management & PR reviews' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 3315, pricePerSeatUSD: 39, description: 'Fine-tuned internal models & knowledge base' },
    ],
    sourceUrl: 'https://github.com/features/copilot/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    category: 'general',
    logo: '🧠',
    color: '#F59E0B',
    badge: 'Top Reasoning',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Standard daily message limits' },
      { id: 'pro', name: 'Pro Plan', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '5× message limit + Artifacts & Projects', popular: true },
      { id: 'max', name: 'Claude Max', pricePerSeat: 2550, pricePerSeatUSD: 30, description: 'Maximum rate limits for heavy engineering queries' },
      { id: 'team', name: 'Team Plan', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Admin console + shared workspace project docs' },
    ],
    sourceUrl: 'https://anthropic.com/pricing',
    lastUpdated: '2026-05',
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
      { id: 'plus', name: 'Plus Individual', pricePerSeat: 1700, pricePerSeatUSD: 20, description: 'Full access to GPT-4o, o1, Advanced Voice & Canvas', popular: true },
      { id: 'team', name: 'Team Workspace', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Workspace data excluded from model training' },
      { id: 'enterprise', name: 'Enterprise Custom', pricePerSeat: 4250, pricePerSeatUSD: 50, description: 'Unlimited high-speed o1 & custom GPT actions' },
    ],
    sourceUrl: 'https://openai.com/chatgpt/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'windsurf',
    name: 'Windsurf (Codeium)',
    category: 'coding',
    logo: '🌊',
    color: '#06B6D4',
    badge: 'Autonomous Flow',
    plans: [
      { id: 'free', name: 'Community Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Limited cascade actions' },
      { id: 'pro', name: 'Windsurf Pro', pricePerSeat: 1275, pricePerSeatUSD: 15, description: 'Unlimited Cascade agent flows & deep repo index', popular: true },
      { id: 'team', name: 'Team Plan', pricePerSeat: 2125, pricePerSeatUSD: 25, description: 'Multi-seat team dashboard + analytics' },
    ],
    sourceUrl: 'https://codeium.com/windsurf',
    lastUpdated: '2026-05',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    category: 'general',
    logo: '✨',
    color: '#38BDF8',
    plans: [
      { id: 'free', name: 'Standard Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Gemini 1.5 Flash' },
      { id: 'pro', name: 'Advanced Pro', pricePerSeat: 1360, pricePerSeatUSD: 16, description: 'Gemini 1.5 Pro with 2M token context window' },
      { id: 'ultra', name: 'Workspace AI', pricePerSeat: 2040, pricePerSeatUSD: 24, description: 'Integrated in Gmail, Docs, Drive & Meet' },
    ],
    sourceUrl: 'https://gemini.google.com',
    lastUpdated: '2026-05',
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    category: 'research',
    logo: '🔍',
    color: '#6366F1',
    badge: 'Research Search',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, pricePerSeatUSD: 0, description: 'Standard search queries' },
      { id: 'pro', name: 'Pro Search', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '300+ Pro searches/day with Claude 3.5 & Sonar' },
      { id: 'enterprise', name: 'Enterprise Pro', pricePerSeat: 3400, pricePerSeatUSD: 40, description: 'Internal file search + team user management' },
    ],
    sourceUrl: 'https://perplexity.ai/pro',
    lastUpdated: '2026-05',
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
      { id: 'premium', name: 'Premium', pricePerSeat: 1700, pricePerSeatUSD: 20, description: '5,000 monthly credits + full code export', popular: true },
      { id: 'team', name: 'Enterprise Team', pricePerSeat: 3400, pricePerSeatUSD: 40, description: 'Shared team components & private registries' },
    ],
    sourceUrl: 'https://v0.dev',
    lastUpdated: '2026-05',
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
