import { getToolById, getPlanById, getAlternatives } from './pricing-data';
import { formatCurrency, formatCurrencyShort } from './currency';

export type ToolInput = {
  toolId: string;
  planId: string;
  seats: number;
  monthlySpend?: number;
};

export type AuditFormData = {
  tools: ToolInput[];
  teamSize: number;
  useCase: 'coding' | 'writing' | 'research' | 'mixed';
  currency?: 'INR' | 'USD';
  email?: string;
  company?: string;
};

export type ToolRecommendation = {
  toolId: string;
  toolName: string;
  currentPlan: string;
  recommendedPlan: string;
  currentCost: number;
  recommendedCost: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
  alternativeTool?: {
    id: string;
    name: string;
    plan: string;
    cost: number;
    savings: number;
    reason: string;
  };
  severity: 'high' | 'medium' | 'low' | 'optimal';
};

export type AuditResult = {
  id?: string;
  formData: AuditFormData;
  recommendations: ToolRecommendation[];
  totalCurrentMonthly: number;
  totalOptimizedMonthly: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  summaryText: string;
  createdAt: string;
};

export function runAudit(formData: AuditFormData): AuditResult {
  const recommendations: ToolRecommendation[] = [];
  let totalCurrentMonthly = 0;
  let totalOptimizedMonthly = 0;
  const currency = formData.currency || 'INR';

  for (const input of formData.tools) {
    const tool = getToolById(input.toolId);
    if (!tool) continue;

    const currentPlan = getPlanById(input.toolId, input.planId);
    if (!currentPlan) continue;

    const currentCost = input.seats * currentPlan.pricePerSeat;
    totalCurrentMonthly += currentCost;

    let bestPlan = currentPlan;
    let recommendationReason = '';
    let severity: ToolRecommendation['severity'] = 'optimal';

    // Rule 1: Check if overprovisioned (Enterprise / Business plan for small team)
    const cheaperPlans = tool.plans.filter(
      (p) => p.pricePerSeat < currentPlan.pricePerSeat && p.pricePerSeat > 0
    );

    if (cheaperPlans.length > 0 && input.seats <= 5 && formData.teamSize <= 10) {
      const betterPlan = cheaperPlans[cheaperPlans.length - 1];
      if (betterPlan.pricePerSeat < currentPlan.pricePerSeat * 0.8) {
        bestPlan = betterPlan;
        recommendationReason = `Your team of ${input.seats} seats on a ${formData.teamSize}-person team is over-provisioned on the ${currentPlan.name} tier. Switching to ${betterPlan.name} gives your devs complete feature access while reducing cost to ${formatCurrency(betterPlan.pricePerSeat * input.seats, currency)}/mo.`;
        severity = 'high';
      }
    }

    // Rule 2: Solo user evaluating tool
    const freePlan = tool.plans.find((p) => p.id === 'free');
    if (freePlan && currentPlan.pricePerSeat > 0 && input.seats === 1 && formData.teamSize === 1) {
      if (bestPlan.id === currentPlan.id) {
        recommendationReason = `For a solo founder, starting on the Free/Community tier allows workflow evaluation before committing to ${formatCurrency(currentPlan.pricePerSeat, currency)}/mo.`;
        bestPlan = freePlan;
        severity = 'medium';
      }
    }

    // Rule 3: Optimal state
    if (severity === 'optimal' && bestPlan.id === currentPlan.id) {
      recommendationReason = `You are on the optimal plan for your current team size. ${currentPlan.name} at ${formatCurrency(currentCost, currency)}/mo provides the right balance of quota and team collaboration.`;
    }

    const recommendedCost = input.seats * bestPlan.pricePerSeat;
    const monthlySavings = currentCost - recommendedCost;
    const annualSavings = monthlySavings * 12;
    totalOptimizedMonthly += recommendedCost;

    // Rule 4: Alternative tool recommendations
    const alternatives = getAlternatives(input.toolId);
    let alternativeTool: ToolRecommendation['alternativeTool'] | undefined;

    if (alternatives.length > 0 && currentCost > 1000) {
      let bestAlt: typeof alternativeTool;
      let bestAltSavings = 0;

      for (const alt of alternatives) {
        const altPro = alt.plans.find((p) => p.id === 'pro' || p.id === 'individual' || p.popular);
        if (altPro && altPro.pricePerSeat < currentPlan.pricePerSeat) {
          const altCost = input.seats * altPro.pricePerSeat;
          const altSavings = currentCost - altCost;
          if (altSavings > bestAltSavings) {
            bestAltSavings = altSavings;
            bestAlt = {
              id: alt.id,
              name: alt.name,
              plan: altPro.name,
              cost: altCost,
              savings: altSavings,
              reason: `Switching to ${alt.name} (${altPro.name}) gives your engineering team full ${tool.category} AI assistance for ${formatCurrency(altCost, currency)}/mo, yielding ${formatCurrency(altSavings, currency)}/mo in direct savings.`,
            };
          }
        }
      }

      if (bestAlt && bestAlt.savings > 300) {
        alternativeTool = bestAlt;
      }
    }

    recommendations.push({
      toolId: input.toolId,
      toolName: tool.name,
      currentPlan: currentPlan.name,
      recommendedPlan: bestPlan.name,
      currentCost,
      recommendedCost,
      monthlySavings,
      annualSavings,
      reason: recommendationReason,
      alternativeTool,
      severity,
    });
  }

  const totalMonthlySavings = totalCurrentMonthly - totalOptimizedMonthly;
  const totalAnnualSavings = totalMonthlySavings * 12;
  const savingsPercentage =
    totalCurrentMonthly > 0 ? Math.round((totalMonthlySavings / totalCurrentMonthly) * 100) : 0;

  // Fallback summary
  let summaryText = '';
  if (totalMonthlySavings >= 25000) {
    summaryText = `🚀 Substantial budget optimization detected! Your team is currently spending ${formatCurrencyShort(totalCurrentMonthly, currency)}/mo on AI software. By eliminating overprovisioned seats and right-sizing tiers, you can unlock ${formatCurrencyShort(totalMonthlySavings, currency)}/mo (${formatCurrencyShort(totalAnnualSavings, currency)}/year) back into your runway.`;
  } else if (totalMonthlySavings >= 5000) {
    summaryText = `💡 High-impact savings found! We detected ${formatCurrency(totalMonthlySavings, currency)}/mo in potential savings across your stack. Smarter tier selection will recover ${formatCurrencyShort(totalAnnualSavings, currency)} annually without impacting developer productivity.`;
  } else if (totalCurrentMonthly > 0) {
    summaryText = `✅ Well-calibrated stack! Your AI spend of ${formatCurrencyShort(totalCurrentMonthly, currency)}/mo is reasonably optimized for your team size. Minor tweaks can save ${formatCurrency(totalMonthlySavings, currency)}/mo.`;
  } else {
    summaryText = `📊 Add your active AI tools to generate a comprehensive ROI and spend optimization audit.`;
  }

  return {
    formData,
    recommendations,
    totalCurrentMonthly,
    totalOptimizedMonthly,
    totalMonthlySavings,
    totalAnnualSavings,
    savingsPercentage,
    summaryText,
    createdAt: new Date().toISOString(),
  };
}
