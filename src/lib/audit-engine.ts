import { getToolById, getPlanById, getAlternatives } from './pricing-data';
import { formatINR, formatINRShort } from './currency';

export type ToolInput = {
  toolId: string;
  planId: string;
  seats: number;
  monthlySpend: number; // what user actually pays
};

export type AuditFormData = {
  tools: ToolInput[];
  teamSize: number;
  useCase: 'coding' | 'writing' | 'research' | 'mixed';
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

  for (const input of formData.tools) {
    const tool = getToolById(input.toolId);
    if (!tool) continue;

    const currentPlan = getPlanById(input.toolId, input.planId);
    if (!currentPlan) continue;

    const currentCost = input.seats * currentPlan.pricePerSeat;
    totalCurrentMonthly += currentCost;

    // Find best plan for their team size and use case
    let bestPlan = currentPlan;
    let recommendationReason = '';
    let severity: ToolRecommendation['severity'] = 'optimal';

    // Rule 1: Check if they can downgrade (over-provisioned)
    const cheaperPlans = tool.plans.filter(
      (p) => p.pricePerSeat < currentPlan.pricePerSeat && p.pricePerSeat > 0
    );

    if (cheaperPlans.length > 0 && input.seats <= 3 && formData.teamSize <= 5) {
      // Small team may not need enterprise/business tiers
      const betterPlan = cheaperPlans[cheaperPlans.length - 1];
      if (betterPlan.pricePerSeat < currentPlan.pricePerSeat * 0.75) {
        bestPlan = betterPlan;
        recommendationReason = `Your team of ${input.seats} seats on a small team doesn't need ${currentPlan.name} tier. ${betterPlan.name} plan provides sufficient features at ${formatINR(betterPlan.pricePerSeat * input.seats)}/mo.`;
        severity = 'high';
      }
    }

    // Rule 2: Check if paying too much vs actual usage
    if (input.monthlySpend > 0 && currentCost > 0) {
      const expectedCost = currentCost;
      if (input.monthlySpend > expectedCost * 1.1) {
        recommendationReason = `You're paying ${formatINR(input.monthlySpend)}/mo but the plan costs ${formatINR(expectedCost)}/mo. Check for duplicate seats.`;
        severity = 'medium';
      }
    }

    // Rule 3: Check if free tier might suffice
    const freePlan = tool.plans.find((p) => p.id === 'free');
    if (freePlan && currentPlan.pricePerSeat > 0 && input.seats === 1 && formData.teamSize === 1) {
      if (bestPlan.id === currentPlan.id) {
        recommendationReason = `Solo user may get started with the Free tier to evaluate fit before committing to ${formatINR(currentPlan.pricePerSeat)}/mo.`;
        bestPlan = freePlan;
        severity = 'medium';
      }
    }

    if (severity === 'optimal' && bestPlan.id === currentPlan.id) {
      recommendationReason = `You're on the right plan for your team size. ${currentPlan.name} at ${formatINR(currentCost)}/mo is well-optimized.`;
    }

    const recommendedCost = input.seats * bestPlan.pricePerSeat;
    const monthlySavings = currentCost - recommendedCost;
    const annualSavings = monthlySavings * 12;
    totalOptimizedMonthly += recommendedCost;

    // Check alternative tools
    const alternatives = getAlternatives(input.toolId);
    let alternativeTool: ToolRecommendation['alternativeTool'] | undefined;

    if (alternatives.length > 0 && currentCost > 1500) {
      // Find cheapest alternative with good value
      let bestAlt: typeof alternativeTool;
      let bestAltSavings = 0;

      for (const alt of alternatives) {
        const altPro = alt.plans.find((p) => p.id === 'pro' || p.id === 'individual');
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
              reason: `${alt.name} ${altPro.name} offers comparable ${tool.category} capabilities at ${formatINR(altCost)}/mo, saving ${formatINR(altSavings)}/mo.`,
            };
          }
        }
      }

      if (bestAlt && bestAlt.savings > 500) {
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

  // Generate summary text (fallback – Claude will enhance this)
  let summaryText = '';
  if (totalMonthlySavings >= 42000) {
    summaryText = `🚀 Significant savings opportunity detected! Your team is spending ${formatINRShort(totalCurrentMonthly)}/mo on AI tools. By optimizing plans and consolidating tools, you could save ${formatINRShort(totalMonthlySavings)}/mo — that's ${formatINRShort(totalAnnualSavings)}/year. Credex can help you implement these changes immediately.`;
  } else if (totalMonthlySavings >= 8500) {
    summaryText = `💡 Good news! We found ${formatINR(totalMonthlySavings)}/mo in potential savings across your AI stack. Smarter plan selection and right-sizing could put ${formatINRShort(totalAnnualSavings)} back in your budget annually.`;
  } else if (totalCurrentMonthly > 0) {
    summaryText = `✅ You're spending well! Your AI tool stack of ${formatINRShort(totalCurrentMonthly)}/mo is reasonably optimized. Minor adjustments could save ${formatINR(totalMonthlySavings)}/mo.`;
  } else {
    summaryText = `📊 Add your AI tools above to get a personalized spend audit with actionable savings recommendations.`;
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
