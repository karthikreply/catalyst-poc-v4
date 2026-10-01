# Scenario Actors and Seeded Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the customer/vendor viewer model with PDM/partner/CPM actors and make Scope open as a CRM/PRM-seeded Heartland brief that can clear in place to the existing guided cold flow.

**Architecture:** Keep the single `SessionProvider` and single Heartland `SessionGraph`. Actor selection remains presentation state in session storage and never resets the graph. Put the static sales-system evidence and pure inference functions in `lib/seed/accountRecord.ts`; keep `ScopeMode` local to Scope so downstream screens receive the same graph and never branch on how it was scoped.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Vitest.

## Global Constraints

- The scenario-aligned spec supersedes actor model addendum B and PRM scope addendum C; session mechanics addendum A remains in force.
- Render only `partner development manager`, `partner`, `channel program manager`, and `platform vendor`; never render Google as the tool or actor organisation.
- Heartland, captures, value arithmetic, artifact structure, delivery, mechanic, and one-graph persistence remain intact.
- End-customer attendees are evidence and invitees, never authenticated viewers.
- Default Scope is seeded; the account pencil clears to cold mode in place.
- Seeded Scope asks exactly two confirmation questions; cold Scope is guided and stepwise.
- Karen's observation must be derived from account evidence and absent in cold mode.
- All integrations remain illustrative; there are no live CRM or PRM calls.
- Handling cost is confirmed by Michelle Dorsey.
- Browser title is `Value session`.
- No commits: this workspace has no `.git` directory.

---

### Task 1: Actor model and viewer persistence

**Files:**
- Modify: `lib/seed.ts`
- Modify: `lib/session.ts`
- Modify: `lib/session.test.ts`
- Modify: `components/session-provider.tsx`
- Modify: `components/app-shell.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `Actor = "pdm" | "partner" | "cpm"`
- Produces: `Viewer = { actor: Actor; name: string; org: string }`
- Produces: `viewerForActor(actor, brand)` and `isSessionReadOnly(actor)`
- Produces: `useSession().actor`, `useSession().setActor`

- [ ] **Step 1: Write failing actor and attribution tests**

Add to `lib/session.test.ts`:

```ts
import { viewerForActor, isSessionReadOnly } from "./session";
import { brands } from "./brands";

describe("actor model", () => {
  it("maps the three authenticated actors without an end-customer viewer", () => {
    expect(viewerForActor("pdm", brands.cdw)).toEqual({
      actor: "pdm",
      name: "Priya Raghavan",
      org: "Platform vendor",
    });
    expect(viewerForActor("partner", brands.cdw)).toEqual({
      actor: "partner",
      name: "Ravi Menon",
      org: "CDW",
    });
    expect(viewerForActor("cpm", brands.cdw)).toEqual({
      actor: "cpm",
      name: "Marcus Hale",
      org: "Platform vendor",
    });
    expect(isSessionReadOnly("pdm")).toBe(false);
    expect(isSessionReadOnly("partner")).toBe(false);
    expect(isSessionReadOnly("cpm")).toBe(true);
  });

  it("restores facilitated handling cost to Michelle", () => {
    const facilitated = applyDeliveryMode(
      applyDeliveryMode(initialSessionGraph, "self-service"),
      "facilitated",
    );
    expect(facilitated.valueInputs.find((input) => input.id === "handling")?.confirmedBy)
      .toBe("Michelle Dorsey");
  });
});
```

- [ ] **Step 2: Verify the actor tests fail**

Run: `npx vitest run lib/session.test.ts`

Expected: FAIL because `viewerForActor` and `Actor` do not exist and handling still restores to Dana.

- [ ] **Step 3: Implement the actor types and pure helpers**

In `lib/seed.ts`, replace `Role` with:

```ts
export type Actor = "pdm" | "partner" | "cpm";
```

In `lib/session.ts`, replace role helpers with:

```ts
export type Viewer = { actor: Actor; name: string; org: string };

export function viewerForActor(actor: Actor, brand: Brand): Viewer {
  if (actor === "pdm") {
    return { actor, name: "Priya Raghavan", org: "Platform vendor" };
  }
  if (actor === "cpm") {
    return { actor, name: "Marcus Hale", org: "Platform vendor" };
  }
  return { actor, name: "Ravi Menon", org: brand.partnerName };
}

export function isSessionReadOnly(actor: Actor) {
  return actor === "cpm";
}
```

Restore facilitated confirmation names with:

```ts
confirmedBy: input.id === "delay" ? "Dana Reyes" : "Michelle Dorsey",
```

Set the seeded handling input's `confirmedBy` to `Michelle Dorsey`.

- [ ] **Step 4: Verify actor tests pass**

Run: `npx vitest run lib/session.test.ts`

Expected: PASS.

- [ ] **Step 5: Migrate provider and shell without resetting graph state**

In `components/session-provider.tsx`:

- Rename role state/API to actor state/API.
- Persist to `catalyst-viewer-actor`.
- Accept only `pdm`, `partner`, and `cpm` during hydration.
- Default to `partner`.
- Derive `canEditSession` with `!isSessionReadOnly(actor)`.
- Keep local-storage graph hydration unchanged.

In `components/app-shell.tsx`, render:

```tsx
<option value="pdm">Priya Raghavan · partner development manager</option>
<option value="partner">Ravi Menon · partner</option>
<option value="cpm">Marcus Hale · channel program manager</option>
```

In `app/page.tsx`, replace the live tiles with:

```tsx
<button onClick={() => { setActor("pdm"); router.push("/scope"); }}>
  <p>I'm a partner development manager</p>
  <p>Convene a value session for one of my partners</p>
</button>
<button onClick={() => { setActor("partner"); router.push("/scope"); }}>
  <p>I'm a partner</p>
  <p>Build a business case about my customer</p>
</button>
```

Keep the disabled campaign tile.

- [ ] **Step 6: Type-check the actor migration**

Run: `npx tsc --noEmit`

Expected: failures only at remaining old `viewer.role` consumers, which Task 3 removes.

---

### Task 2: Static CRM/PRM record and derived Karen inference

**Files:**
- Create: `lib/seed/accountRecord.ts`
- Create: `lib/seed/accountRecord.test.ts`

**Interfaces:**
- Produces: `ScopeMode = "seeded" | "cold"`
- Produces: `AccountRecord`, `AccountNote`, and `heartlandAccountRecord`
- Produces: `deriveKarenObservation(record: AccountRecord | null): string | null`
- Produces: `crmBadge(partnerName: string)` and `prmBadge`

- [ ] **Step 1: Write failing record tests**

Create `lib/seed/accountRecord.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  deriveKarenObservation,
  heartlandAccountRecord,
} from "./accountRecord";

describe("Heartland account record", () => {
  it("contains scruffy attributed evidence and a stale opportunity", () => {
    expect(heartlandAccountRecord.notes.some((note) => note.partial)).toBe(true);
    expect(heartlandAccountRecord.opportunity.closeDatePushes).toBe(2);
    expect(heartlandAccountRecord.opportunity.weeksSinceUpdate).toBe(6);
    expect(heartlandAccountRecord.contacts.find((contact) => contact.name === "Karen Whitfield"))
      .toMatchObject({ economicBuyer: true, activityLogged: false });
  });

  it("derives the Karen inference only when record evidence exists", () => {
    const observation = deriveKarenObservation(heartlandAccountRecord);
    expect(observation).toContain("no logged activity");
    expect(observation).toContain("close date has slipped twice");
    expect(observation).toContain("likely related");
    expect(deriveKarenObservation(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Verify record tests fail**

Run: `npx vitest run lib/seed/accountRecord.test.ts`

Expected: FAIL because `accountRecord.ts` does not exist.

- [ ] **Step 3: Implement the static record and inference**

Create `lib/seed/accountRecord.ts` with:

```ts
export type ScopeMode = "seeded" | "cold";
export type AccountNote = {
  date: string;
  author: string;
  kind: "call" | "discovery" | "note" | "email";
  text: string;
  partial?: boolean;
};

export type AccountRecord = {
  account: { name: string; industry: string; revenue: string };
  notes: AccountNote[];
  opportunity: {
    name: string;
    stage: string;
    value: number;
    closeDatePushes: number;
    weeksSinceUpdate: number;
  };
  contacts: Array<{
    name: string;
    role: string;
    relationship?: string;
    economicBuyer?: boolean;
    activityLogged: boolean;
  }>;
  partnerProfile: {
    partner: string;
    fundingHistory: string;
    registeredDeals: number;
  };
};

export const prmBadge = "From PRM · Salesforce";
export const crmBadge = (partnerName: string) => `From CRM · ${partnerName}`;

export const heartlandAccountRecord: AccountRecord = {
  account: {
    name: "Heartland Mutual Insurance",
    industry: "Insurance",
    revenue: "$900M revenue",
  },
  notes: [
    {
      date: "14 Jan",
      author: "Jenna Kowalski",
      kind: "call",
      text: 'Dana Reyes raised board pressure on AI. Claims intake is the pain; she used the word "drowning." No budget identified. Asked us to come back with options.',
    },
    {
      date: "22 Jan",
      author: "Ravi Menon",
      kind: "discovery",
      text: "Document-heavy intake, PDF claim forms, ~200 person team. Six-day cycle to first decision. Dana said they covered Q1 volume with overtime rather than hiring.",
    },
    {
      date: "29 Jan",
      author: "Ravi Menon",
      kind: "note",
      text: "Flagged compliance early. Robert Osei will need an audit trail on anything automated. Need to confirm whether the low-confidence...",
      partial: true,
    },
  ],
  opportunity: {
    name: "Heartland Mutual — AI claims modernisation",
    stage: "Stage 2",
    value: 2_100_000,
    closeDatePushes: 2,
    weeksSinceUpdate: 6,
  },
  contacts: [
    { name: "Dana Reyes", role: "VP Claims Operations", relationship: "Champion", activityLogged: true },
    { name: "Michelle Dorsey", role: "Claims Supervisor", activityLogged: true },
    { name: "Alex Chen", role: "Senior Developer", activityLogged: true },
    { name: "Robert Osei", role: "Compliance", activityLogged: true },
    { name: "Sandeep Nair", role: "Infrastructure", activityLogged: true },
    { name: "Karen Whitfield", role: "CFO", relationship: "Economic buyer", economicBuyer: true, activityLogged: false },
  ],
  partnerProfile: {
    partner: "CDW",
    fundingHistory: "Two prior funded pilots",
    registeredDeals: 1,
  },
};

export function deriveKarenObservation(record: AccountRecord | null) {
  if (!record) return null;
  const buyer = record.contacts.find((contact) => contact.economicBuyer);
  if (!buyer || buyer.activityLogged || record.opportunity.closeDatePushes < 2) return null;
  return `${buyer.name}, the economic buyer, has no logged activity. The close date has slipped twice. Those facts are likely related; invite her or brief Dana to carry the funding ask.`;
}
```

- [ ] **Step 4: Verify record tests pass**

Run: `npx vitest run lib/seed/accountRecord.test.ts`

Expected: PASS.

---

### Task 3: Seeded and cold Scope UI

**Files:**
- Modify: `app/scope/page.tsx`
- Modify: `app/plan/page.tsx`

**Interfaces:**
- Consumes: account record and inference from Task 2
- Produces: default seeded Scope with exactly two confirmations
- Produces: in-place cold Scope with five guided questions

- [ ] **Step 1: Define the two question sets**

In `app/scope/page.tsx`:

```ts
const seededQuestions = [
  {
    question: "Roughly how many claims a day?",
    reason: "The record does not contain this number, and the business case depends on it.",
    chips: ["~400 a day", "250–500 a day", "Not confirmed yet"],
  },
  {
    question: "Karen Whitfield is listed as CFO with no logged activity. She funds the pilot. Invite her, or brief Dana to carry it?",
    reason: "The economic buyer and the operating champion need an explicit route to the funding ask.",
    chips: ["Invite Karen", "Brief Dana to carry it", "Decide after the session"],
  },
];

const coldQuestions = [
  { question: "Is there an active opportunity?", chips: ["Stage 2 opportunity", "Early discovery", "No opportunity yet"] },
  { question: "Roughly how many claims a day?", chips: ["~400 a day", "250–500 a day", "Not confirmed yet"] },
  { question: "Who’s likely to be in the room?", chips: ["Ops, supervisor, IT, compliance", "Claims and IT leads", "The full working team"] },
  { question: "Is compliance a factor?", chips: ["Audit trail required", "Compliance is joining", "Human review is mandatory"] },
  { question: "Has the CFO engaged?", chips: ["CFO aware", "Champion briefed the CFO", "Economic buyer not attending"] },
];
```

- [ ] **Step 2: Render seeded Scope by default**

The seeded layout must include:

- Account header with `From CRM · {brand.partnerName}` and a pencil.
- Four-sentence brief including `Dana Reyes called it "drowning" on 14 Jan`.
- `<details>` containing all source notes and the incomplete marker.
- Stale opportunity with `Last updated 6 weeks ago`.
- Partner profile with `From PRM · Salesforce`.
- Matched pattern and curated-library citation.
- Derived Karen callout.
- Exactly two stepwise confirmation questions and a Plan button after both.

- [ ] **Step 3: Make the account pencil switch to cold mode**

On pencil click:

```ts
setMode("cold");
setCustomerName("");
setContext("");
setAnswers([]);
setThinking(false);
```

Cold mode must render blank account/context fields, no account brief, no source notes, no PRM fields, and no Karen inference. It uses the five guided questions and routes to the same `/plan`.

- [ ] **Step 4: Rebadge Plan attendees**

In `app/plan/page.tsx`, change attendee source copy to:

```tsx
{person.role} · From CRM · {brand.partnerName}
```

Keep Karen's `Economic buyer · invited, not attending` reason and Robert's warning unchanged.

- [ ] **Step 5: Type-check Scope**

Run: `npx tsc --noEmit`

Expected: no Scope or account-record errors.

---

### Task 4: Actor-compatible downstream screens and neutral title

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/run/page.tsx`
- Modify: `components/value-sprint-panel.tsx`
- Modify: `components/ghost-ledger-panel.tsx`
- Modify: `app/artifact/page.tsx`
- Modify: `app/telemetry/page.tsx`
- Modify: `lib/telemetry.ts`

**Interfaces:**
- Consumes: `viewer.actor`
- Preserves: partner edit ownership, CPM historical read-only behavior
- Temporarily maps PDM and CPM to all-program telemetry until §6 implements the nested tiers

- [ ] **Step 1: Set neutral static metadata**

Following Next.js 16 static metadata guidance, set:

```ts
export const metadata: Metadata = {
  title: "Value session",
  description: "Partner-led AI value discovery demo",
};
```

- [ ] **Step 2: Replace old viewer branches**

- `partner`: editable session and DAF action.
- `pdm`: editable session; artifact actions are Review funding request / Flag as reference story.
- `cpm`: read-only historical session; artifact actions are Review funding request / Flag as reference story.
- Run and value panels show historical/read-only copy only for `cpm`.

In `app/artifact/page.tsx`:

```ts
const actions = {
  partner: {
    primary: "Start DAF funding request",
    secondary: qualified ? "Request a facilitated session" : "Schedule pilot kickoff",
  },
  pdm: { primary: "Review funding request", secondary: "Flag as reference story" },
  cpm: { primary: "Review funding request", secondary: "Flag as reference story" },
}[viewer.actor];
```

- [ ] **Step 3: Keep telemetry compiling before §6**

Change `scopeTelemetry` options to accept `Actor`:

```ts
export function scopeTelemetry(
  rows: TelemetrySession[],
  opts: { actor: Actor; partnerName: string },
) {
  if (opts.actor === "partner") {
    return rows.filter((item) => item.partner === opts.partnerName);
  }
  return rows;
}
```

Update the telemetry page to use `viewer.actor`. Label PDM as `My partners` and CPM as `Program performance`, but defer book filtering, funnel reconciliation, claims, and recent-table variety to §6.

- [ ] **Step 4: Verify no old actor vocabulary renders**

Run:

```powershell
rg '"customer"|"vendor"|viewer\.role|setRole|\bRole\b' app components lib
```

Expected: no old viewer-model code. Heartland customer-domain prose may remain, but no customer/vendor actor options.

- [ ] **Step 5: Run focused and full verification**

Run:

```powershell
npx vitest run lib/session.test.ts lib/seed/accountRecord.test.ts
npx vitest run
npx tsc --noEmit
npm run build
```

Expected: all tests pass, type-check exits 0, build lists all seven routes.

- [ ] **Step 6: Smoke-check routes and acceptance**

Run the production server and verify:

- `/` offers PDM and partner, not customer.
- `/scope` opens seeded and shows two questions.
- Account pencil clears to cold mode and removes Karen observation.
- `/plan` shows `From CRM · CDW`.
- `/artifact` changes actions by actor without changing Heartland evidence.
- Page title is `Value session`.
- Viewer switching and returning to Scope do not reset graph values or captures.

