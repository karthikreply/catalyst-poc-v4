import { describe, expect, it } from "vitest";

import { calculateDailyValue, calculateAnnualValue, formatCompactCurrency, formatCurrency, formatPreciseCurrency } from "./value";

describe("value calculations", () => {
  it("recomputes the agreed daily and annual values from editable inputs", () => {
    expect(calculateDailyValue(400, 2, 31)).toBe(24_800);
    expect(calculateAnnualValue(400, 2, 31)).toBe(6_200_000);
  });

  it("rounds displayed currency to whole dollars", () => {
    expect(formatCurrency(31_000.49)).toBe("$31,000");
  });

  it("preserves agreed decimal precision in arithmetic inputs", () => {
    expect(formatPreciseCurrency(38.75)).toBe("$38.75");
    expect(formatPreciseCurrency(31)).toBe("$31.00");
  });

  it("formats compact values deterministically across server and browser", () => {
    expect(formatCompactCurrency(27_200_000)).toBe("$27.2M");
    expect(formatCompactCurrency(850_000)).toBe("$850K");
  });
});
