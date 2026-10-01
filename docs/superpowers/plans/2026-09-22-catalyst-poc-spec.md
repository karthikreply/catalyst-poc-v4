# Catalyst POC Spec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Heartland demo so one session graph can be viewed through partner, customer, and vendor lenses, with delivery mode, a Plan-selected session mechanic (value sprint vs ghost ledger), brand-scoped telemetry, a Pilot spec handoff, and a preserved `$38.75 → $31.00` value-sprint binding.

**Architecture:** Keep a single `SessionProvider` and a single Heartland `SessionGraph`. Viewer, delivery, and mechanic are fields on that graph (mechanic is `session.mechanic`). The mechanic changes **only** the Run value panel and the Artifact cost decomposition. Do not create per-role pages, a second graph, a second Run route, or a live LLM. Telemetry rates come from one exported benchmark object; screens only read it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Vitest.

**Spec:** `C:\Users\k.kalamohan\Desktop\google\catalyst-poc-build-spec-consolidated.md`  
**Addendum:** `C:\Users\k.kalamohan\Desktop\google\catalyst-addendum-a-session-mechanics.md`

## Global Constraints

- Extend existing files; do not rebuild Run, Artifact PDF, `lib/value.ts` math, or a second app.
- Nothing may render as Google-branded or as a Google product. Vendor is “platform vendor”.
- Nothing provisions, deploys, or generates code. Integration seams stay unavailable and explained.
- One Heartland graph. Delivery mode and mechanic switch presentation of that graph; they do not pick another customer.
- Viewer / brand / delivery / mechanic / route changes must not reset the graph or discard value edits, cost-component inputs, or captures.
- `mechanic` is `'value-sprint' | 'ghost-ledger'`. It is chosen on Plan beside delivery. It changes only the Run value panel (and the Artifact cost section that renders that panel’s decomposition). Agenda, captures, next-step routing, telemetry layout, Pilot spec, gate, role model, and brand switch stay invariant.
- Direct links default to `partner`. Entry gate is narrative, not authorization.
- Vendor Run is a historical completed-session snapshot of the same entities, not live observation.
- Partner telemetry follows **active brand**. SoftwareOne + partner = SoftwareOne rows only.
- Benchmarks are exact from one object: delivery 60 / 22 / 45; mechanic value-sprint **58%** and ghost-ledger **67%** on a **smaller ghost-ledger base**. Do not round these in components.
- Value-sprint `$38.75 → $31.00` must keep using `calculateDailyValue` / `calculateAnnualValue`. Ghost ledger uses `lib/cost-model.ts` (`monthlyTotal`, `perSecondRate`, `annualFromMonthly`). Freeze writes only `Outcome.annualValue`.
- Vendor never sees a running per-second counter; historical Run shows the frozen figure.
- Demo live controls: (1) mechanic switch on Run, value sprint → ghost ledger, same agenda/captures; (2) Viewing as on Artifact then Telemetry. Do not also switch brand or delivery in the same minute. Value-sprint `$38.75 → $31.00` remains an automated regression and a separate beat if time allows.
- Unavailable controls use `aria-disabled`, stay focusable, and open an explanation. Native `disabled` buttons that cannot be focused are not allowed.
- Sentence case. Frozen clock `10:42`. No live model. No second Run route.
- If a pencil is non-functional, it must still be unavailable-and-explained.

---

## File map

| File | Responsibility |
|---|---|
| `lib/seed.ts` | Session types including `mechanic`, Heartland graph, attendees, patterns + `knownGaps`, cost-component seed |
| `lib/session.ts` | `viewerForRole`, `applyDeliveryMode`, `applyMechanic`, `isQualified`, `shouldResetGraph` |
| `lib/cost-model.ts` | Ghost-ledger decomposition: component monthly totals, per-second rate, freeze annual |
| `lib/telemetry.ts` | Deterministic 250-row seed + exported `telemetryBenchmarks` including mechanic rates |
| `lib/brands.ts` | Org-aware signoff / email / artifact copy from existing brand object |
| `lib/value.ts` | Unchanged value-sprint math |
| `components/session-provider.tsx` | One context: graph + brand + viewer + delivery + mechanic; no graph reset on `/` or `/scope` |
| `components/app-shell.tsx` | Stepper including Pilot spec; Viewing as; brand switch |
| `components/unavailable-control.tsx` | Shared focusable unavailable control |
| `app/page.tsx` | Entry gate (stop redirecting to `/scope`) |
| `app/run/page.tsx` | Existing layout + vendor historical banner + self-service three differences + mechanic value panel |
| `components/value-sprint-panel.tsx` | Current single-rate panel extracted from Run |
| `components/ghost-ledger-panel.tsx` | Ticking counter, four editable components, freeze |
| `app/artifact/page.tsx` | Role-routed actions + confirmation labels + DAF panel + mechanic cost decomposition |
| `app/plan/page.tsx` | Delivery choice, mechanic selector, two emails, CRM seam, attendees |
| `app/scope/page.tsx` | Source badge + pencil; vendor read-only |
| `app/pilot-spec/page.tsx` | New funded-pilot screen |
| `app/telemetry/page.tsx` | Three lenses, one dataset |
| `lib/*.test.ts` | Pin sprint math, ghost-ledger math, qualification, delivery/mechanic apply, telemetry rates and brand filter |

Do not add `lib/llm.ts` unless explicitly requested later.

---

### Task 1: Seed model, delivery apply, qualification

**Files:**
- Modify: `lib/seed.ts`
- Create: `lib/session.ts`
- Create: `lib/session.test.ts`

**Interfaces:**
- Produces: `Session` with `mechanic: 'value-sprint' | 'ghost-ledger'`, `CostComponent`, `SessionGraph`, `applyDeliveryMode`, `applyMechanic`, `isQualified`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { initialSessionGraph } from "./seed";
import { applyDeliveryMode, applyMechanic, isQualified } from "./session";
import { calculateAnnualValue } from "./value";

describe("applyDeliveryMode", () => {
  it("keeps edited values and captures when switching delivery", () => {
    const edited = {
      ...initialSessionGraph,
      valueInputs: initialSessionGraph.valueInputs.map((input) =>
        input.id === "handling" ? { ...input, quantity: 31 } : input,
      ),
      captures: [
        ...initialSessionGraph.captures,
        {
          id: "cap-extra",
          sessionId: initialSessionGraph.session.id,
          stepId: "constraints",
          attributedTo: "Dana Reyes",
          text: "Keep the overtime evidence.",
          capturedAt: "2026-09-21T10:50:00-05:00",
        },
      ],
    };
    const selfServe = applyDeliveryMode(edited, "self-service");
    expect(selfServe.session.delivery).toBe("self-service");
    expect(selfServe.session.facilitator).toBeNull();
    expect(selfServe.valueInputs.every((input) => input.confirmedBy === null)).toBe(true);
    expect(selfServe.valueInputs.find((input) => input.id === "handling")?.quantity).toBe(31);
    expect(selfServe.captures).toHaveLength(edited.captures.length);
    expect(isQualified(selfServe)).toBe(true);

    const back = applyDeliveryMode(selfServe, "facilitated");
    expect(back.session.facilitator?.name).toBe("Ravi Menon");
    expect(back.valueInputs.find((input) => input.id === "handling")?.quantity).toBe(31);
    expect(back.valueInputs.find((input) => input.id === "handling")?.confirmedBy).toBe("Dana Reyes");
    expect(back.captures).toHaveLength(edited.captures.length);
    expect(back.outcome.annualValue).toBe(calculateAnnualValue(400, 2, 31));
  });

  it("applyMechanic changes only session.mechanic", () => {
    const edited = applyDeliveryMode(initialSessionGraph, "self-service");
    const ghost = applyMechanic(edited, "ghost-ledger");
    expect(ghost.session.mechanic).toBe("ghost-ledger");
    expect(ghost.session.delivery).toBe("self-service");
    expect(ghost.captures).toEqual(edited.captures);
    expect(ghost.agenda).toEqual(edited.agenda);
    expect(ghost.valueInputs).toEqual(edited.valueInputs);
    expect(ghost.costComponents).toEqual(edited.costComponents);
    expect(applyMechanic(ghost, "value-sprint").session.mechanic).toBe("value-sprint");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/session.test.ts`
Expected: FAIL because `applyDeliveryMode` is missing.

- [ ] **Step 3: Implement types and helpers**

In `lib/seed.ts`, extend types to match the spec plus addendum (`mechanic: "value-sprint" | "ghost-ledger"`, `facilitator` object or null, `practiceSponsor`, `delivery`, `qualified`, `confirmedBy: string | null`, `respondentConfirmed`, `Attendee`, `CostComponent[]` on the graph). Default `mechanic` is `"value-sprint"`. Seed four ghost-ledger components (ids `handling`, `review`, `rework`, `overtime`) with the Heartland inputs from addendum A; `monthlyTotal` is never stored on the component as an input field — derive it. Keep Heartland captures. Add Karen as `attendance: "invited-not-attending"`. Add `knownGaps` to each pattern.

In `lib/session.ts`:

```ts
import type { Brand } from "./brands";
import type { SessionGraph } from "./seed";

export type Role = "partner" | "customer" | "vendor";

export function isQualified(graph: SessionGraph) {
  return graph.valueInputs.every((input) => input.respondentConfirmed) && Boolean(graph.outcome.owner);
}

export function applyDeliveryMode(graph: SessionGraph, delivery: "facilitated" | "self-service"): SessionGraph {
  const valueInputs = graph.valueInputs.map((input) =>
    delivery === "self-service"
      ? { ...input, confirmedBy: null, respondentConfirmed: true }
      : {
          ...input,
          confirmedBy: input.id === "claims" ? "Michelle Dorsey" : "Dana Reyes",
          respondentConfirmed: true,
        },
  );
  return {
    ...graph,
    session: {
      ...graph.session,
      delivery,
      facilitator: delivery === "self-service" ? null : { name: "Ravi Menon", title: "Solution Specialist, AI & Data" },
      qualified: delivery === "self-service" ? isQualified({ ...graph, valueInputs }) : false,
    },
    valueInputs,
  };
}

export function viewerForRole(role: Role, brand: Brand) {
  if (role === "customer") return { role, name: "Dana Reyes", org: "Heartland Mutual Insurance" };
  if (role === "vendor") return { role, name: "Marcus Hale", org: "Platform vendor" };
  return { role, name: "Ravi Menon", org: brand.partnerName };
}

export function applyMechanic(graph: SessionGraph, mechanic: "value-sprint" | "ghost-ledger"): SessionGraph {
  return { ...graph, session: { ...graph.session, mechanic } };
}
```

`applyDeliveryMode` must not change `mechanic`, `costComponents` input quantities, agenda, or captures. `applyMechanic` must not change delivery, value inputs, cost-component inputs, agenda, or captures.

Default facilitated value inputs keep existing `confirmedBy` names and `respondentConfirmed: true`. Seed `costComponents.confirmedBy` as Michelle Dorsey (handling), Dana Reyes (review, overtime), Robert Osei (rework). One component in the self-service/ghost demo path can be set `confirmedBy: null` only via an explicit test helper — default seed is fully confirmed so freeze is clean; Artifact estimate-label is tested by nulling one `confirmedBy` in a unit test.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/session.test.ts lib/value.test.ts`
Expected: PASS. Value tests still pass unchanged.

- [ ] **Step 5: Commit**

```bash
git add lib/seed.ts lib/session.ts lib/session.test.ts
git commit -m "feat: add delivery-mode apply without resetting Heartland edits"
```

---

### Task 1b: Ghost-ledger cost model

**Files:**
- Create: `lib/cost-model.ts`
- Create: `lib/cost-model.test.ts`
- Modify: `lib/value.ts` only if a shared `DAYS_PER_MONTH = 30` constant is needed; do not change sprint 250-day annual math

**Interfaces:**
- Produces: `componentMonthlyTotal(component)`, `ledgerMonthlyTotal(components)`, `perSecondRate(monthlyTotal)`, `annualFromMonthly(monthlyTotal)`, `freezeLedger(graph)`

Adapt the GPN `computeCostOfInaction` idea: decompose to monthly, derive per-second from a 30-day month, never store derived totals as inputs. Field names are the claims scenario below.

Pin these formulas (handling uses the existing daily function × 30 so units are honest monthly):

| id | Inputs | monthlyTotal |
|---|---|---|
| `handling` | 400 claims/day, 2 days, $38.75 | `calculateDailyValue(...) * 30` = 930_000 |
| `review` | 340 h/week, $61/h | `340 * 4.33 * 61` rounded = 89_810 |
| `rework` | 400 claims/day, 6%, $210 | `400 * 30 * 0.06 * 210` = 151_200 |
| `overtime` | $48,000/month | 48_000 |

Monthly sum 1_219_004 (`Math.round(340 * 4.33 * 61)` = 89_804). Per-second = monthly / (30 * 24 * 3600). Annual freeze = `Math.round(monthly * 12)`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { initialSessionGraph } from "./seed";
import {
  annualFromMonthly,
  componentMonthlyTotal,
  freezeLedger,
  ledgerMonthlyTotal,
  perSecondRate,
} from "./cost-model";
import { calculateDailyValue } from "./value";

describe("ghost ledger cost model", () => {
  it("derives monthly totals from inputs only", () => {
    const handling = initialSessionGraph.costComponents.find((row) => row.id === "handling")!;
    expect(componentMonthlyTotal(handling)).toBe(calculateDailyValue(400, 2, 38.75) * 30);
    expect(ledgerMonthlyTotal(initialSessionGraph.costComponents)).toBe(1_219_010);
    expect(perSecondRate(1_219_010)).toBeCloseTo(1_219_010 / (30 * 24 * 3600), 6);
  });

  it("freeze writes annual into outcome and does not edit inputs", () => {
    const frozen = freezeLedger(initialSessionGraph);
    expect(frozen.session.ledgerFrozen).toBe(true);
    expect(frozen.outcome.annualValue).toBe(annualFromMonthly(1_219_010));
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
```

Add `ledgerFrozen: boolean` and `partiallyEstimated?: boolean` on session/outcome as specified: freeze persists only `Outcome.annualValue` plus a `session.ledgerFrozen` flag (needed for distinct frozen UI). Addendum forbids persisting the frozen ledger anywhere other than annualValue; store `ledgerFrozen` on `session` as UI state of the same graph, not a second ledger document.

- [ ] **Step 2: Run** `npx vitest run lib/cost-model.test.ts` — expect FAIL.

- [ ] **Step 3: Implement `lib/cost-model.ts`**

```ts
export function componentMonthlyTotal(component: CostComponent): number {
  const qty = (label: string) => component.inputs.find((input) => input.label === label)!.quantity;
  switch (component.id) {
    case "handling":
      return calculateDailyValue(qty("Claims per day"), qty("Avoidable delay"), qty("Handling cost")) * 30;
    case "review":
      return Math.round(qty("Hours per week") * 4.33 * qty("Loaded rate"));
    case "rework":
      return Math.round(qty("Claims per day") * 30 * qty("Reopen rate") * qty("Cost each"));
    case "overtime":
      return Math.round(qty("Monthly overtime"));
    default:
      throw new Error(`Unknown component ${component.id}`);
  }
}

export function ledgerMonthlyTotal(components: CostComponent[]) {
  return components.reduce((sum, row) => sum + componentMonthlyTotal(row), 0);
}

export function perSecondRate(monthlyTotal: number) {
  return monthlyTotal / (30 * 24 * 3600);
}

export function annualFromMonthly(monthlyTotal: number) {
  return Math.round(monthlyTotal * 12);
}

export function freezeLedger(graph: SessionGraph): SessionGraph {
  const monthly = ledgerMonthlyTotal(graph.costComponents);
  return {
    ...graph,
    session: { ...graph.session, ledgerFrozen: true },
    outcome: {
      ...graph.outcome,
      annualValue: annualFromMonthly(monthly),
      partiallyEstimated: graph.costComponents.some((row) => row.confirmedBy === null),
    },
  };
}
```

Reopen rate seed quantity is `0.06`, not `6`. Display as 6%.

- [ ] **Step 4: Run** `npx vitest run lib/cost-model.test.ts lib/value.test.ts` — PASS. Sprint tests unchanged.

- [ ] **Step 5: Commit** `feat: add ghost-ledger cost decomposition`

---

### Task 2: Deterministic telemetry seed

**Files:**
- Modify: `lib/telemetry.ts`
- Modify: `lib/telemetry.test.ts`

**Interfaces:**
- Produces: `telemetryBenchmarks`, `buildTelemetrySessions()`, `scopeTelemetry(rows, { role, partnerName })`

- [ ] **Step 1: Write failing tests**

Replace `lib/telemetry.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { buildTelemetrySessions, scopeTelemetry, telemetryBenchmarks } from "./telemetry";

describe("telemetryBenchmarks", () => {
  it("exports the pinned rates and counts", () => {
    expect(telemetryBenchmarks).toEqual({
      facilitatedSessions: 150,
      selfServiceSessions: 100,
      facilitatedConverted: 90,
      selfServiceConverted: 22,
      selfServiceQualified: 45,
      facilitatedConversionRate: 60,
      selfServiceConversionRate: 22,
      selfServiceQualificationRate: 45,
      valueSprintSessions: 205,
      valueSprintConverted: 119,
      ghostLedgerSessions: 45,
      ghostLedgerConverted: 30,
      valueSprintConversionRate: 58,
      ghostLedgerConversionRate: 67,
    });
  });

  it("seeds exact cohort sizes", () => {
    const rows = buildTelemetrySessions();
    expect(rows).toHaveLength(250);
    expect(rows.filter((row) => row.delivery === "facilitated")).toHaveLength(150);
    expect(rows.filter((row) => row.delivery === "self-service")).toHaveLength(100);
    expect(rows.filter((row) => row.delivery === "facilitated" && row.converted).length).toBe(90);
    expect(rows.filter((row) => row.delivery === "self-service" && row.converted).length).toBe(22);
    expect(rows.filter((row) => row.delivery === "self-service" && row.qualified).length).toBe(45);
    expect(rows.filter((row) => row.mechanic === "value-sprint")).toHaveLength(205);
    expect(rows.filter((row) => row.mechanic === "ghost-ledger")).toHaveLength(45);
    expect(rows.filter((row) => row.mechanic === "value-sprint" && row.converted).length).toBe(119);
    expect(rows.filter((row) => row.mechanic === "ghost-ledger" && row.converted).length).toBe(30);
  });

  it("filters partner view to the active brand only", () => {
    const rows = buildTelemetrySessions();
    const scoped = scopeTelemetry(rows, { role: "partner", partnerName: "SoftwareOne" });
    expect(scoped.every((row) => row.partner === "SoftwareOne")).toBe(true);
    expect(scoped.some((row) => row.partner === "CDW")).toBe(false);
    expect(scopeTelemetry(rows, { role: "vendor", partnerName: "SoftwareOne" }).map((row) => row.partner)).toEqual(
      expect.arrayContaining(["CDW", "SoftwareOne", "Insight", "SHI"]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/telemetry.test.ts`
Expected: FAIL on missing `telemetryBenchmarks` / `delivery`.

- [ ] **Step 3: Rewrite seed construction**

Do **not** loop 250 times and derive rates. Build arrays of exact lengths, then concatenate.

```ts
export const telemetryBenchmarks = {
  facilitatedSessions: 150,
  selfServiceSessions: 100,
  facilitatedConverted: 90,
  selfServiceConverted: 22,
  selfServiceQualified: 45,
  facilitatedConversionRate: 60,
  selfServiceConversionRate: 22,
  selfServiceQualificationRate: 45,
  valueSprintSessions: 205,
  valueSprintConverted: 119,
  ghostLedgerSessions: 45,
  ghostLedgerConverted: 30,
  valueSprintConversionRate: 58,
  ghostLedgerConversionRate: 67,
} as const;

export function scopeTelemetry(
  rows: TelemetrySession[],
  opts: { role: "partner" | "customer" | "vendor"; partnerName: string },
) {
  if (opts.role === "customer") return [];
  if (opts.role === "partner") return rows.filter((row) => row.partner === opts.partnerName);
  return rows;
}
```

Comparison UI must display `telemetryBenchmarks.facilitatedConversionRate` etc., never `Math.round(converted / total * 100)` in components.

Keep `summarizeTelemetry` for card counts. Add `delivery`, `mechanic`, `qualified`, `converted`, `daysToFunded` on each row. Ghost-ledger base is visibly smaller (45 vs 205); do not smooth it. Spread partners so SoftwareOne has a non-empty partner view.

Chart addition is a dimension on existing breakdowns (sessions or conversion by mechanic), not a new chart type. UI reads `valueSprintConversionRate` and `ghostLedgerConversionRate` from the benchmark object.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/telemetry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/telemetry.ts lib/telemetry.test.ts
git commit -m "feat: pin telemetry conversion rates in one seed object"
```

---

### Task 3: Viewer context, entry gate, header switch

**Files:**
- Modify: `components/session-provider.tsx`
- Modify: `components/app-shell.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx` only if the gate should sit inside the shell (it should: Viewing as is on every screen)

**Interfaces:**
- Consumes: `viewerForRole`, `applyDeliveryMode`
- Produces: `useSession()` with `viewer`, `setRole`, `setDelivery`, `canEditSession`

Critical persistence change: delete the `entryPaths` reset that currently wipes `localStorage` on `/` and `/scope`. Spec: returning to Scope, changing viewer, brand, or delivery must not reload seed.

- [ ] **Step 1: Write failing tests for persistence helpers**

Add to `lib/session.test.ts`:

```ts
it("does not treat gate or scope as a graph reset", () => {
  const { shouldResetGraph } = require("./session") as typeof import("./session");
  expect(shouldResetGraph("/")).toBe(false);
  expect(shouldResetGraph("/scope")).toBe(false);
  expect(shouldResetGraph("/run")).toBe(false);
});
```

Implement `shouldResetGraph` as `() => false` (keep the function so the old reset cannot sneak back as a pathname check).

- [ ] **Step 2: Run test**

Run: `npx vitest run lib/session.test.ts`
Expected: FAIL until helper exists.

- [ ] **Step 3: Extend provider**

```ts
type SessionContextValue = {
  graph: SessionGraph;
  brandId: BrandId;
  brand: Brand;
  viewer: Viewer;
  setBrandId: (id: BrandId) => void;
  setRole: (role: Role) => void;
  setDelivery: (delivery: "facilitated" | "self-service") => void;
  setMechanic: (mechanic: "value-sprint" | "ghost-ledger") => void;
  updateValue: (id: string, quantity: number) => void;
  addCapture: (capture: Omit<Capture, "id" | "sessionId" | "capturedAt">) => void;
  setActiveStep: (stepId: string) => void;
  canEditSession: boolean;
};
```

- Restore graph + brand + role from storage. Default role `partner`.
- `setBrandId` updates brand **and** `graph.session.partnerId` (`cdw` / `softwareone`) without touching value inputs.
- `setDelivery` calls `applyDeliveryMode` only.
- `setMechanic` calls `applyMechanic` only. Does not freeze/unfreeze. Does not touch captures or value inputs.
- `setRole` changes viewer only.
- `canEditSession` is `viewer.role !== "vendor"`.
- `updateCostInput(componentId, inputLabel, quantity)` updates one ghost-ledger input; does not write `outcome.annualValue` until freeze.
- `freezeLedger()` calls `freezeLedger` from `lib/cost-model.ts`.
- `updateValue` still uses `calculateAnnualValue` for value-sprint only. If `!canEditSession`, both updaters return immediately.

Persist role in `sessionStorage` key `catalyst-viewer-role`.

- [ ] **Step 4: Entry gate**

Replace `app/page.tsx` redirect with two live tiles (`I'm a partner`, `I'm a customer`) plus a third **unavailable** campaign tile (Task 4 component; until then a button with `aria-disabled` and explanation). Partner tile `setRole("partner")` then `router.push("/scope")`. Customer tile `setRole("customer")` then same `/scope`.

- [ ] **Step 5: App shell**

Stepper:

```ts
const steps = [
  { href: "/scope", label: "Scope" },
  { href: "/plan", label: "Plan" },
  { href: "/run", label: "Run" },
  { href: "/artifact", label: "Artifact" },
  { href: "/pilot-spec", label: "Pilot spec" },
  { href: "/telemetry", label: "Telemetry" },
];
```

Add `Viewing as` `<select>` with partner / customer / vendor. Keep brand select. Label viewing as with `viewer.name · viewer.org`.

- [ ] **Step 6: Manual check**

Run: `npm run dev`
Open `/run` cold — Viewing as is partner, graph is Heartland. Switch role — values unchanged. Open `/` then `/scope` — graph still has edits if you made them.

- [ ] **Step 7: Commit**

```bash
git add components/session-provider.tsx components/app-shell.tsx app/page.tsx lib/session.ts lib/session.test.ts
git commit -m "feat: add viewing-as without resetting the Heartland graph"
```

---

### Task 4: Unavailable control

**Files:**
- Create: `components/unavailable-control.tsx`

**Interfaces:**
- Produces: `<UnavailableControl label owner explanation />`

- [ ] **Step 1: Implement the control** (no component test harness required; this repo’s tests are Vitest unit tests)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UnavailableControl({
  label,
  owner,
  explanation,
}: {
  label: string;
  owner: string;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button type="button" variant="outline" aria-disabled="true" onClick={() => setOpen((value) => !value)}>
        {label}
      </Button>
      {open && (
        <p className="mt-2 text-sm text-black/58">
          {explanation} Owner: {owner}. This demo does not submit, provision, or connect.
        </p>
      )}
    </div>
  );
}
```

Do not use the native `disabled` attribute.

- [ ] **Step 2: Commit**

```bash
git add components/unavailable-control.tsx
git commit -m "feat: add focusable unavailable integration control"
```

---

### Task 5: Run screen — vendor historical + self-service + mechanic panel

**Files:**
- Modify: `app/run/page.tsx` only. Do not create `/run/self-service` or `/run/ghost`.
- Create: `components/value-sprint-panel.tsx` (extract current panel)
- Create: `components/ghost-ledger-panel.tsx`

Preserve: left rail, capture list, Suggest follow-up delay, frozen wall-clock `10:42`. The **loudest** element when mechanic is ghost-ledger is the per-second counter, not the sprint daily figure.

- [ ] **Step 1: Keep sprint regression**

Keep `lib/value.test.ts` for `$38.75 → $31.00`. `updateValue` / `bindAnnualValue` apply **only** when `mechanic === "value-sprint"`.

- [ ] **Step 2: Branch only the value panel**

```tsx
{graph.session.mechanic === "ghost-ledger" ? (
  <GhostLedgerPanel />
) : (
  <ValueSprintPanel />
)}
```

Agenda, header, captures, footer stay shared. Self-service three differences still apply around that panel (banner, prompt voice, capture attribution, confirmation labels).

**Value sprint panel:** current UI. Vendor: read-only inputs, no edits. Extract `bindAnnualValue` in `lib/session.ts` and call it from `updateValue` only when mechanic is value-sprint.

**Ghost ledger panel:**
- If `viewer.role === "vendor"` OR `session.ledgerFrozen`: show frozen annual (and monthly) with distinct committed styling. **No `setInterval`.** Copy nearby: historical/completed — not a live tick.
- Else: large per-second counter from `perSecondRate(ledgerMonthlyTotal(...))`. Tick via `setInterval` 100ms or 1s; `document.hidden` or unmount must clear the interval. `prefers-reduced-motion`: show the rate as `$X / s` without animating digits.
- Four rows: inputs editable, derived monthly read-only, `confirmedBy` or `unconfirmed`.
- `Freeze the ledger` calls `freezeLedger()`. After freeze, counter stops and styling switches to committed.
- Editing any input recomputes monthly + tick rate immediately (`value-flash`).

- [ ] **Step 3: Manual regression**

1. Default value-sprint: handling 31 → daily `$24,800`, annual `$6,200,000`.
2. On Run, switch mechanic to ghost ledger using the **same** `setMechanic` control mirrored in the Run header (Plan remains the place it is introduced). One piece of state. This is how the presenter shows the spine is identical in five seconds without leaving the session.
3. Same agenda step, same captures. Counter ticks. Edit overtime. Freeze. Annual updates.
4. Viewing as vendor: frozen figure, no tick.
5. Switch mechanic back to value-sprint: sprint panel returns; captures still present.

Demo script: exercise mechanic **once** on the way through Run. Do not also switch brand or delivery in that minute.

- [ ] **Step 4: Commit** `feat: swap run value panel by session mechanic`

```bash
git add app/run/page.tsx components/value-sprint-panel.tsx components/ghost-ledger-panel.tsx
git commit -m "feat: swap run value panel by session mechanic"
```

---

### Task 6: Artifact role actions and confirmation labels

**Files:**
- Modify: `app/artifact/page.tsx`

Keep html2canvas/jsPDF `downloadPdf`. Headline annual figure is `graph.outcome.annualValue`.

- [ ] **Step 1: Confirmation copy + mechanic decomposition**

If `mechanic === "value-sprint"`: existing single-line arithmetic (`400 × 2 × $38.75`). Self-service uses `Respondent-confirmed · not facilitator-verified`.

If `mechanic === "ghost-ledger"`: render four component rows with per-component arithmetic and `confirmedBy` (or `unconfirmed` / estimate label). If `outcome.partiallyEstimated` or any `confirmedBy === null`, show `Partially estimated` on the total. Never average unconfirmed rows into a quiet headline.

This is the only Artifact structure change from addendum A. Do not add new artifact sections.

- [ ] **Step 2: Same-position action block**

```tsx
const actions = {
  partner: {
    primary: "Start DAF funding request",
    secondary: graph.session.qualified ? "Request a facilitated session" : "Schedule pilot kickoff",
  },
  customer: { primary: "Share with my partner manager", secondary: "Request a pilot" },
  vendor: { primary: "Review funding request", secondary: "Flag as reference story" },
}[viewer.role];
```

Qualified self-service: partner (and customer if spec only lists artifact action generally) must show `Request a facilitated session` as specified — on Artifact for the session that is qualified. Spec: artifact gains that action. Show it for partner and customer when `qualified`; vendor does not get it.

Partner primary opens a panel:
- Sentence: `Partner development funding is claimed by the partner using the session evidence.`
- Fields: session, customer, use case, value, evidence list from captures/value inputs
- `Practice sponsor: Tom Brennan · {brand.partnerName}`
- `UnavailableControl` label `Submit funding claim` / `Submits to partner portal`

Secondary customer/vendor can be unavailable-explained if they are demo-only.

Change the bottom link from Telemetry to Pilot spec: `href="/pilot-spec"`.

- [ ] **Step 3: Verify role switch does not remount different data**

Stay on `/artifact`, cycle Viewing as. Document quotes and `$` figures stay; only the action labels change.

- [ ] **Step 4: Commit**

```bash
git add app/artifact/page.tsx
git commit -m "feat: route artifact next steps by viewer without new data"
```

---

### Task 7: Plan delivery choice and Scope source badges

**Files:**
- Modify: `app/plan/page.tsx`
- Modify: `app/scope/page.tsx`
- Modify: `lib/brands.ts` so `signoff` is `Ravi Menon · ${partnerName}` (already true; keep org from brand)

- [ ] **Step 1: Plan delivery and mechanic**

Two delivery options calling `setDelivery` (emails unchanged).

Beside them, two mechanic options calling `setMechanic`:
- `Value sprint` — agree the cost of the problem and commit to a next step.
- `Ghost ledger` — the room watches the cost accumulate in real time. Needs their real numbers.

If `!canEditSession`, neither control changes state. Mechanic must not alter emails, attendees, or CRM seam.

Copy buttons on each email.

Two draft emails from `brand.emailIntro` / `brand.signoff`:
- Facilitated: invite to the live three-hour session, ask Dana to bring the named attendees.
- Self-service: send a guided walkthrough link, ask Dana to confirm volume/cost and a named owner.

Attendee list from seed `Attendee[]` including Karen labelled `Economic buyer · invited, not attending` + `From CRM`. Robert warning reason unchanged.

Quiet lines: pattern typical value range; `Practice sponsor: Tom Brennan · {brand.partnerName} AI & Data Practice Lead`.

`UnavailableControl` `Push to CRM` owner `{brand.partnerName}`.

If `!canEditSession`, show vendor reason and do not change delivery.

- [ ] **Step 2: Scope**

Customer name row: badge `From partner portal`, pencil toggles to typed (`source: typed`). Follow-ups stay four chips. After fourth, confirm `Document-heavy intake` and go to `/plan`. Vendor: textarea and chips read-only with the completed-session reason.

Remove any behavior that treats Scope as a graph reset.

- [ ] **Step 3: Commit**

```bash
git add app/plan/page.tsx app/scope/page.tsx lib/brands.ts
git commit -m "feat: add delivery emails, mechanic selector, and field-source badges"
```

---

### Task 8: Telemetry three lenses

**Files:**
- Modify: `app/telemetry/page.tsx`

- [ ] **Step 1: Customer lens**

If `viewer.role === "customer"`, render only: `Telemetry belongs to the partner and the platform vendor.` Do not show charts.

- [ ] **Step 2: Vendor and partner**

```ts
const rows = scopeTelemetry(telemetrySeed, {
  role: viewer.role === "customer" ? "customer" : viewer.role,
  partnerName: brand.partnerName,
});
```

Comparison block **must** read:

```ts
telemetryBenchmarks.facilitatedConversionRate
telemetryBenchmarks.selfServiceConversionRate
telemetryBenchmarks.selfServiceQualificationRate
telemetryBenchmarks.valueSprintConversionRate
telemetryBenchmarks.ghostLedgerConversionRate
```

Add mechanic as a dimension on an existing breakdown (e.g. sessions by mechanic with the pinned 58% / 67% in the details column). Show the smaller ghost-ledger n (45) in that label so the base is visible. No new chart component.

Partner view: omit “Sessions by partner” entirely (access boundary). Add cards `My team's sessions this quarter` and `Funding claims submitted` (seed-stable integers derived from scoped rows, not invented in JSX).

Vendor view: keep sessions by partner. Overlay Heartland as today.

Detail toggle default off; note: `Detail is shared only when {brand.partnerName} submits a funding claim.`

- [ ] **Step 3: Brand-on-telemetry acceptance**

With Viewing as partner, switch CDW → SoftwareOne. Table/cards change to SoftwareOne; no CDW partner label remains. Switch back.

- [ ] **Step 4: Commit**

```bash
git add app/telemetry/page.tsx
git commit -m "feat: scope telemetry by viewer and active brand"
```

---

### Task 9: Pilot spec screen

**Files:**
- Create: `app/pilot-spec/page.tsx`

Headline: `What the funded pilot consists of`. Not hackathon logistics.

Inherit from graph: use case, owner Alex Chen, constraint with `Compliance boundary agreed (Robert Osei, 12 Feb)`.

Readiness amber: `Data owner identified`, `Security review needed — allow 5 days`.

Environment: 4–5 generic services (document store, identity, logging, review queue, extraction worker) with one-line reasons. Data requirement + redaction. Copyable snippet that is **not** GCP/Google/GitHub-branded, e.g. comment-only YAML-like enable list. Line: `Provisioning happens in the customer's own cloud account, not here.`

Starter kit from `patterns.find document-intake` including **known gaps**.

`UnavailableControl` `Provision environment` owner Heartland.
`UnavailableControl` `Fork repository` explanation: starter kit would be handed to the customer's build team.

- [ ] **Step 1: Create the page and link Artifact → Pilot spec → Telemetry**

- [ ] **Step 2: Cold-path check**

Gate → Scope chips → Plan → Run → Artifact → Pilot spec → Telemetry with no typing.

- [ ] **Step 3: Commit**

```bash
git add app/pilot-spec/page.tsx app/artifact/page.tsx components/app-shell.tsx
git commit -m "feat: add funded-pilot spec handoff screen"
```

---

### Task 10: Brand polish and final acceptance

**Files:**
- Modify: `lib/brands.ts` if sponsor/facilitator org strings need helpers
- Grep the repo for `Google`, `GCP`, `GitHub`, `hackathon` in app/lib/components (not node_modules)

- [ ] **Step 1: Brand helper**

```ts
export function withBrandPeople(brand: Brand) {
  return {
    facilitatorOrg: brand.partnerName,
    sponsorLine: `Tom Brennan · ${brand.partnerName} AI & Data Practice Lead`,
    signoff: `Ravi Menon · ${brand.partnerName}`,
  };
}
```

Use this on Plan, Artifact, emails, Run subtitle. Do not hardcode CDW in those chrome strings.

- [ ] **Step 2: Run the suite**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all current tests plus new session/telemetry tests pass. `tsc` clean.

- [ ] **Step 3: Walk acceptance 1–16 from the main spec and 1–8 from addendum A**

Especially main 4, 5, 6, 7, 12 and addendum 1, 2, 4, 7, 8.

- [ ] **Step 4: Commit**

```bash
git add lib/brands.ts
git commit -m "feat: drive facilitator and sponsor org from active brand"
```

---

## Out of plan

- `lib/llm.ts` and live model calls
- Auth, CRM, provisioning, campaign entry
- Second customer / sister scenario
- Replacing jsPDF with print-to-PDF
- The other three session concepts (Use-Case Draft, War Room, Time Traveler)
- Persisting a frozen ledger document other than `Outcome.annualValue` (+ `session.ledgerFrozen` flag)
- Branching Scope, Pilot spec, entry gate, role model, or brand switch for mechanic

## Spec coverage

| Spec | Task |
|---|---|
| Viewer + gate + no reset | 3 |
| Run centrepiece + value-sprint regression | 5 |
| Ghost-ledger model + freeze | 1b, 5 |
| Artifact roles + DAF + mechanic decomposition | 6 |
| Delivery + self-service + qualified | 1, 5, 6, 7 |
| Mechanic selector on Plan | 7 |
| Telemetry rates + brand filter + mechanic dimension | 2, 8 |
| Plan/Scope badges | 7 |
| Pilot spec | 9 |
| Brand + seams | 4, 7, 9, 10 |
| Demo: mechanic switch, then Viewing as | 5 + 6 + 8 |
