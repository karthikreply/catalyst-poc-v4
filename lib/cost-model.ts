import type { CostComponent, SessionGraph } from "./seed";
import { calculateDailyValue } from "./value";

function qty(component: CostComponent, label: string) {
  const input = component.inputs.find((row) => row.label === label);
  if (!input) throw new Error(`${component.id} is missing ${label}`);
  return typeof input.quantity === "number" && Number.isFinite(input.quantity) ? input.quantity : 0;
}

export function componentAnnualTotal(component: CostComponent): number {
  switch (component.id) {
    case "handling":
      return calculateDailyValue(qty(component, "Claims per day"), qty(component, "Avoidable delay"), qty(component, "Handling cost")) * 250;
    case "review":
      return Math.round(qty(component, "Hours per week") * 50 * qty(component, "Loaded rate"));
    case "rework":
      return Math.round(qty(component, "Claims per day") * 250 * qty(component, "Reopen rate") * qty(component, "Cost each"));
    case "overtime":
      return Math.round(qty(component, "Monthly overtime") * 12);
    default:
      throw new Error(`Unknown component ${component.id}`);
  }
}

export function componentMonthlyTotal(component: CostComponent): number {
  return componentAnnualTotal(component) / 12;
}

export function ledgerAnnualTotal(components: CostComponent[]) {
  return components.reduce((sum, row) => sum + componentAnnualTotal(row), 0);
}

export function ledgerMonthlyTotal(components: CostComponent[]) {
  return ledgerAnnualTotal(components) / 12;
}

export function perSecondRate(annualTotal: number) {
  return annualTotal / (365 * 24 * 3600);
}

export function freezeLedger(graph: SessionGraph): SessionGraph {
  const annual = ledgerAnnualTotal(graph.costComponents);
  return {
    ...graph,
    session: { ...graph.session, ledgerFrozen: true },
    outcome: {
      ...graph.outcome,
      annualValue: annual,
      partiallyEstimated: graph.costComponents.some((row) => row.confirmedBy === null),
    },
  };
}
