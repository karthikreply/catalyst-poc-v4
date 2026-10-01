export function calculateDailyValue(
  claimsPerDay: number,
  avoidableDays: number,
  handlingCost: number,
) {
  return Math.round(claimsPerDay * avoidableDays * handlingCost);
}

export function calculateAnnualValue(
  claimsPerDay: number,
  avoidableDays: number,
  handlingCost: number,
) {
  return calculateDailyValue(claimsPerDay, avoidableDays, handlingCost) * 250;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatPreciseCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    const millions = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `$${millions}M`;
  }
  if (Math.abs(value) >= 1_000) {
    const thousands = (value / 1_000).toFixed(1).replace(/\.0$/, "");
    return `$${thousands}K`;
  }
  return formatCurrency(value);
}
