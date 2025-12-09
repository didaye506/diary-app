// src/lib/plan.ts
export type Plan = "free" | "pro" | null | undefined;

export function isProPlan(plan: Plan, isActive?: boolean | null) {
  if (isActive === false) return false;
  return plan === "pro";
}
