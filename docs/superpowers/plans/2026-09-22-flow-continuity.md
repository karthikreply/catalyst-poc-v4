# Flow Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cold scope reversible and guided, keep its next action visible, and render partner DAF preparation in the partner brand while retaining Material vendor review.

**Architecture:** Add pure session helpers for role matching and seeded restoration, then expose restoration through the session context with a one-time local backup. Make the shell’s funding treatment actor-aware and split the funding page into token-isolated partner and vendor components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, CSS custom properties, Vitest.

## Global Constraints

- Keep all implementation local; do not push without explicit user approval.
- Partner funding preparation uses only `--brand-*` tokens.
- PDM/CPM funding review uses only `--md-sys-*` tokens.
- Cold roles remain free-text and are matched loosely.
- Existing session evidence must survive actor and route changes.

---

### Task 1: Seeded restoration and public role matching

**Files:**
- Modify: `lib/session.ts`
- Modify: `lib/session.test.ts`
- Modify: `components/session-provider.tsx`

**Interfaces:**
- Produces: `coldRoleMatch(role: string): string | null`
- Produces: `restoreSeededGraph(saved: SessionGraph | null): SessionGraph`
- Produces through context: `restoreSeededScope(): void`

- [ ] **Step 1: Write failing helper tests**

Add tests asserting:

```ts
expect(coldRoleMatch("Frontline")).toBe("Frontline supervisor");
expect(coldRoleMatch("Analyst")).toBeNull();
expect(coldRoleMatch("CFO")).toBe("Economic buyer");

const editedSeeded = applyClaimsVolumeChoice(initialSessionGraph, "range-250-500");
expect(restoreSeededGraph(editedSeeded)).toEqual(editedSeeded);
expect(restoreSeededGraph(applyColdScope(initialSessionGraph, company, attendees)))
  .toEqual(initialSessionGraph);
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npx vitest run lib/session.test.ts`

Expected: FAIL because `coldRoleMatch` and `restoreSeededGraph` are not exported.

- [ ] **Step 3: Implement the pure helpers**

Export the existing loose matcher as:

```ts
export function coldRoleMatch(role: string) {
  return matchedColdRole(role)?.role ?? null;
}

export function restoreSeededGraph(saved: SessionGraph | null) {
  return saved?.session.scopeMode === "seeded" ? saved : initialSessionGraph;
}
```

Import `initialSessionGraph` into `lib/session.ts`.

- [ ] **Step 4: Add reversible state to the provider**

Add `SEEDED_GRAPH_KEY = "catalyst-seeded-graph"`. In `setColdScope`, save the current graph only when `current.session.scopeMode === "seeded"`. Add:

```ts
function restoreSeededScope() {
  if (!canEditSession) return;
  const saved = localStorage.getItem(SEEDED_GRAPH_KEY);
  let parsed: SessionGraph | null = null;
  if (saved) {
    try {
      parsed = JSON.parse(saved) as SessionGraph;
    } catch {
      localStorage.removeItem(SEEDED_GRAPH_KEY);
    }
  }
  setGraph(restoreSeededGraph(parsed));
}
```

Expose it from `SessionContextValue` and the provider value.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run lib/session.test.ts && npx tsc --noEmit`

Expected: all session tests pass and TypeScript exits 0.

---

### Task 2: Guided cold scope and persistent continuation

**Files:**
- Modify: `app/scope/page.tsx`

**Interfaces:**
- Consumes: `coldRoleMatch(role)` and `restoreSeededScope()`

- [ ] **Step 1: Add restoration and role guidance**

In cold mode, add a top action:

```tsx
<Button variant="outline" onClick={restoreSeededScope}>
  Use account record instead
</Button>
```

Above attendee rows, show:

```tsx
<p className="mt-3 text-xs leading-5 text-black/55">
  Recognised role examples: Operations owner, Frontline supervisor, Developer,
  Compliance, Infrastructure, Economic buyer.
</p>
```

Use row-specific placeholders such as `Frontline supervisor` and render:

```tsx
{person.role.trim() && (
  <p className={coldRoleMatch(person.role) ? "text-emerald-700" : "text-amber-800"}>
    {coldRoleMatch(person.role)
      ? `Matched as ${coldRoleMatch(person.role)}`
      : "Not matched to a required pattern role"}
  </p>
)}
```

- [ ] **Step 2: Make continuation always visible**

Replace the conditional link with an always-rendered completion card spanning both columns. Show two checklist rows:

```tsx
const companyComplete = Boolean(name && industry && sizeBand);
const attendeeCount = completeAttendees.length;
```

Use a disabled `Button` while incomplete and a branded `Link` to `/plan` when complete. Copy must state the missing requirement, for example `Add 2 more complete attendees`.

- [ ] **Step 3: Run lint and typecheck**

Run: `npx eslint app/scope/page.tsx && npx tsc --noEmit`

Expected: no errors or warnings.

---

### Task 3: Actor-aware funding continuity

**Files:**
- Modify: `lib/vendor-shell.ts`
- Modify: `lib/vendor-shell.test.ts`
- Modify: `components/app-shell.tsx`
- Modify: `components/brand-flow-frame.tsx`
- Modify: `app/funding/page.tsx`

**Interfaces:**
- Changes: `isBrandFlowPath(pathname: string, actor: Actor): boolean`
- Partner funding component reads only `--brand-*`.
- Vendor funding component reads only `--md-sys-*`.

- [ ] **Step 1: Write failing shell tests**

Add:

```ts
expect(isBrandFlowPath("/funding", "partner")).toBe(true);
expect(isBrandFlowPath("/funding", "pdm")).toBe(false);
expect(isBrandFlowPath("/funding", "cpm")).toBe(false);
expect(isBrandFlowPath("/artifact", "cpm")).toBe(true);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run lib/vendor-shell.test.ts`

Expected: FAIL because funding is not actor-aware.

- [ ] **Step 3: Implement actor-aware shell selection**

Update the helper:

```ts
export function isBrandFlowPath(pathname: string, actor: Actor) {
  if (pathname.startsWith("/funding")) return actor === "partner";
  return Object.keys(flowLabels).some((path) => pathname.startsWith(path));
}
```

Pass `viewer.actor` from `AppShell`.

- [ ] **Step 4: Add a funding state to the partner frame**

When `pathname.startsWith("/funding")`, replace the numbered stepper with a compact label:

```tsx
<div className="ml-auto text-right">
  <p className="text-xs text-black/45">Business case</p>
  <p className="text-sm font-semibold">Funding request</p>
</div>
```

Keep the brand picker and product title unchanged.

- [ ] **Step 5: Split the funding page by actor**

Keep `FundingPage` token-neutral:

```tsx
export default function FundingPage() {
  const { viewer } = useSession();
  return viewer.actor === "partner"
    ? <PartnerFundingRequest />
    : <VendorFundingReview />;
}
```

Move the current Material presentation into `VendorFundingReview`. Build `PartnerFundingRequest` with brand-surface cards, a disabled `Submit funding claim` control, `Draft · not submitted`, the same evidence, and visible links back to `/artifact` and onward to `/pilot-spec`. Do not place `--md-sys-*` classes in that component.

- [ ] **Step 6: Run focused tests, lint, and typecheck**

Run: `npx vitest run lib/vendor-shell.test.ts && npx eslint app/funding/page.tsx components/app-shell.tsx components/brand-flow-frame.tsx && npx tsc --noEmit`

Expected: tests pass with no lint or type errors.

---

### Task 4: Full local flow verification

**Files:**
- No production changes expected.

- [ ] **Step 1: Run automated verification**

Run:

```powershell
npx vitest run
npx tsc --noEmit
npx eslint .
git diff --check
npm run build
```

Expected: 0 failures; static output includes `/`, `/scope`, `/plan`, `/run`, `/artifact`, `/pilot-spec`, `/funding`, and `/telemetry`.

- [ ] **Step 2: Verify local route availability**

Request every route from `http://localhost:3000` and expect HTTP 200.

- [ ] **Step 3: Perform the local flow checklist**

Verify:

1. Seeded Scope → `Start without the record` → enter cold data → `Use account record instead` restores the previous seeded choices.
2. `Frontline` shows `Matched as Frontline supervisor`; `Analyst` shows `Not matched`.
3. The completion card remains visible and enables after company fields plus three complete attendees.
4. Partner Artifact → DAF opens a partner-branded funding request; Back returns to Artifact with the same evidence.
5. On `/funding`, changing to PDM or CPM shows Material vendor review; returning to Partner restores the partner treatment.
6. Reload preserves graph, actor, brand, mechanic, evidence, and route behavior.

- [ ] **Step 4: Report locally without pushing**

Provide the local URL, test/build evidence, and any remaining limitations. Do not commit implementation or push until the user approves the locally reviewed result.
