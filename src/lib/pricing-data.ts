export type Plan = {
  id: string;
  name: string;
  pricePerSeat: number; // monthly in ₹
  description: string;
};

export type Tool = {
  id: string;
  name: string;
  category: 'coding' | 'writing' | 'research' | 'general';
  logo: string;
  color: string;
  plans: Plan[];
  sourceUrl: string;
  lastUpdated: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'coding',
    logo: '🖱️',
    color: '#6D28D9',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: 'Limited completions' },
      { id: 'pro', name: 'Pro', pricePerSeat: 1700, description: '500 fast requests/mo' },
      { id: 'business', name: 'Business', pricePerSeat: 3400, description: 'Team features + privacy' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 6800, description: 'Custom + SSO' },
    ],
    sourceUrl: 'https://cursor.sh/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'coding',
    logo: '🐙',
    color: '#2563EB',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: '2000 completions/mo' },
      { id: 'individual', name: 'Individual', pricePerSeat: 850, description: 'Unlimited completions' },
      { id: 'business', name: 'Business', pricePerSeat: 1615, description: 'Team management' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 3315, description: 'Custom models + fine-tuning' },
    ],
    sourceUrl: 'https://github.com/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    category: 'general',
    logo: '🤖',
    color: '#D97706',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: 'Limited usage' },
      { id: 'pro', name: 'Pro', pricePerSeat: 1700, description: '5× more usage than free' },
      { id: 'max', name: 'Max', pricePerSeat: 2550, description: 'Max usage limits' },
      { id: 'team', name: 'Team', pricePerSeat: 2125, description: 'Per user, collaborative' },
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
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: 'GPT-4o mini' },
      { id: 'plus', name: 'Plus', pricePerSeat: 1700, description: 'GPT-4o + o1' },
      { id: 'team', name: 'Team', pricePerSeat: 2125, description: 'Per user, workspace' },
      { id: 'enterprise', name: 'Enterprise', pricePerSeat: 4250, description: 'Custom pricing' },
    ],
    sourceUrl: 'https://openai.com/pricing',
    lastUpdated: '2026-05',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    category: 'general',
    logo: '✨',
    color: '#06B6D4',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: 'Gemini 1.5 Flash' },
      { id: 'pro', name: 'Pro', pricePerSeat: 1360, description: 'Gemini Advanced' },
      { id: 'ultra', name: 'Ultra (One AI Premium)', pricePerSeat: 2720, description: 'All Google AI features' },
    ],
    sourceUrl: 'https://one.google.com/about/ai-premium',
    lastUpdated: '2026-05',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    category: 'coding',
    logo: '🌊',
    color: '#059669',
    plans: [
      { id: 'free', name: 'Free', pricePerSeat: 0, description: 'Limited flow actions' },
      { id: 'pro', name: 'Pro', pricePerSeat: 1530, description: 'Unlimited flows' },
      { id: 'team', name: 'Team', pricePerSeat: 2550, description: 'Per user, team features' },
    ],
    sourceUrl: 'https://windsurf.com/pricing',
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

/** Get alternative tools in same category */
export function getAlternatives(toolId: string): Tool[] {
  const tool = getToolById(toolId);
  if (!tool) return [];
  return TOOLS.filter((t) => t.id !== toolId && t.category === tool.category);
}
