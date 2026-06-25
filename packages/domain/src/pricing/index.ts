export const pricingPlanIds = ["starter", "growth", "scale"] as const;

export type PricingPlanId = (typeof pricingPlanIds)[number];

export interface PricingPlan {
  id: PricingPlanId;
  name: string;
  includedEvents: number;
}

export interface UtcMonthWindow {
  periodEnd: string;
  periodStart: string;
}

export interface PricingUsageSummary extends UtcMonthWindow {
  id: PricingPlanId;
  includedEvents: number;
  name: string;
  remainingEvents: number;
  usedEvents: number;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    includedEvents: 100_000
  },
  {
    id: "growth",
    name: "Growth",
    includedEvents: 1_000_000
  },
  {
    id: "scale",
    name: "Scale",
    includedEvents: 10_000_000
  }
];

export const pricingPlanMap: Readonly<Record<PricingPlanId, PricingPlan>> = {
  starter: pricingPlans[0],
  growth: pricingPlans[1],
  scale: pricingPlans[2]
};

export function getPricingPlan(planId: PricingPlanId): PricingPlan {
  return pricingPlanMap[planId];
}

export function getUtcMonthWindow(date: Date): UtcMonthWindow {
  const periodStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const periodEnd = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );

  return {
    periodEnd: periodEnd.toISOString(),
    periodStart: periodStart.toISOString()
  };
}

export function summarizePricingUsage(input: {
  now: Date;
  planId: PricingPlanId;
  usedEvents: number;
}): PricingUsageSummary {
  const plan = getPricingPlan(input.planId);
  const window = getUtcMonthWindow(input.now);

  return {
    id: plan.id,
    includedEvents: plan.includedEvents,
    name: plan.name,
    periodEnd: window.periodEnd,
    periodStart: window.periodStart,
    remainingEvents: Math.max(plan.includedEvents - input.usedEvents, 0),
    usedEvents: input.usedEvents
  };
}
