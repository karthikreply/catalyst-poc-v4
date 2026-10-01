import { describe, expect, it } from "vitest";

import { initialSessionGraph } from "./seed";
import {
  componentAnnualTotal,
  componentMonthlyTotal,
  freezeLedger,
  ledgerAnnualTotal,
  ledgerMonthlyTotal,
  perSecondRate,
} from "./cost-model";
import { calculateDailyValue } from "./value";

describe("ghost ledger cost model", () => {
  it("annualises labour-derived components on 250 working days", () => {
    const handling = initialSessionGraph.costComponents.find((row) => row.id === "handling")!;
    const review = initialSessionGraph.costComponents.find((row) => row.id === "review")!;
    const rework = initialSessionGraph.costComponents.find((row) => row.id === "rework")!;
    const overtime = initialSessionGraph.costComponents.find((row) => row.id === "overtime")!;

    expect(componentAnnualTotal(handling)).toBe(calculateDailyValue(400, 2, 38.75) * 250);
    expect(componentAnnualTotal(review)).toBe(340 * 50 * 61);
    expect(componentAnnualTotal(rework)).toBe(400 * 250 * 0.06 * 210);
    expect(componentAnnualTotal(overtime)).toBe(48_000 * 12);
    expect(componentMonthlyTotal(handling)).toBeCloseTo(7_750_000 / 12, 6);
  });

  it("derives every monthly figure from the shared annual total", () => {
    const annual = ledgerAnnualTotal(initialSessionGraph.costComponents);
    expect(annual).toBe(10_623_000);
    expect(ledgerMonthlyTotal(initialSessionGraph.costComponents)).toBeCloseTo(annual / 12, 6);
    expect(perSecondRate(annual)).toBeCloseTo(annual / (365 * 24 * 3600), 8);
  });

  it("treats non-finite persisted quantities as zero", () => {
    const handling = initialSessionGraph.costComponents.find((row) => row.id === "handling")!;
    const invalid = {
      ...handling,
      inputs: handling.inputs.map((input) =>
        input.label === "Handling cost" ? { ...input, quantity: Number.NaN } : input,
      ),
    };

    expect(componentAnnualTotal(invalid)).toBe(0);
  });

  it("freezes the exact annual total that the artifact consumes", () => {
    const frozen = freezeLedger(initialSessionGraph);
    expect(frozen.session.ledgerFrozen).toBe(true);
    expect(frozen.outcome.annualValue).toBe(ledgerAnnualTotal(initialSessionGraph.costComponents));
    expect(frozen.outcome.annualValue).toBe(10_623_000);
    expect(frozen.costComponents).toEqual(initialSessionGraph.costComponents);
  });

  it("partial estimate when any confirmedBy is null", () => {
    const partial = {
      ...initialSessionGraph,
      costComponents: initialSessionGraph.costComponents.map((row) =>
        row.id === "overtime" ? { ...row, confirmedBy: null } : row,
      ),
    };
    expect(freezeLedger(partial).outcome.partiallyEstimated).toBe(true);
  });
});
