# Partner Session Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let partners visibly enrich imported sessions, attribute self-service inputs to named confirmers, and advance through Scope, Plan, and Run from a consistent top-right action.

**Architecture:** Extend the persisted `SessionGraph` with provenance-safe partner notes and add pure graph transforms for note and confirmer updates. Expose those transforms through the existing provider, then make narrowly scoped UI changes to Scope, Plan, Run, and the value-sprint panel.

**Tech Stack:** Next.js 16.3.5 App Router, React 19.2.8, TypeScript, Tailwind CSS 4, Vitest 5.

## Global Constraints

- Imported CRM/account/opportunity facts remain read-only.
- Partner notes never enter `captures` and never affect capture count.
- Campaign entry, invitation delivery, authentication, and a new customer actor remain outside this change.
- CPM remains read-only.
- Existing v3 local-storage graphs hydrate without a storage-key bump.
- Scope, Plan, and Run primary navigation uses one top-right position.
- Follow red-green-refactor: each production behavior follows a test that failed for the expected reason.

---

### Task 1: Persist provenance-safe partner notes

**Files:**
- Modify: `lib/seed.ts`
- Modify: `lib/session.ts`
- Modify: `lib/session.test.ts`
- Modify: `components/session-provider.tsx`

**Interfaces:**
- Produces: `PartnerNote = { id: string; author: string; text: string; updatedAt: string }`
- Produces: `SessionGraph.partnerNotes: PartnerNote[]`
- Produces: `savePartnerNote(graph, note): SessionGraph`
- Produces: `useSession().savePartnerNote(noteId, text)`

- [ ] **Step 1: Write failing graph tests**

Add imports for `savePartnerNote`, then add:

```ts
describe("partner session notes", () => {
  const note = {
    id: "partner-note-1",
    author: "Ravi Menon",
    text: "Claims leadership wants the first review in October.",
    updatedAt: "2026-09-23T15:00:00.000Z",
  };

  it("adds and edits partner context without changing captured testimony", () => {
    const added = savePartnerNote(initialSessionGraph, note);
    const edited = savePartnerNote(added, { ...note, text: "Claims leadership wants an October review." });

    expect(added.partnerNotes).toEqual([note]);
    expect(edited.partnerNotes[0].text).toBe("Claims leadership wants an October review.");
    expect(edited.captures).toEqual(initialSessionGraph.captures);
  });

  it("hydrates an existing v3 graph without partner notes", () => {
    const legacy = { ...initialSessionGraph } as Partial<typeof initialSessionGraph>;
    delete legacy.partnerNotes;
    expect(hydrateSessionGraph(legacy as typeof initialSessionGraph).partnerNotes).toEqual([]);
  });

  it("keeps seeded partner context out of a cold session and restores the seeded copy", () => {
    const seeded = savePartnerNote(initialSessionGraph, note);
    const cold = applyColdScope(seeded, coldScopeDefaults.company, coldScopeDefaults.attendees);
    expect(cold.partnerNotes).toEqual([]);
    expect(restoreSeededGraph(seeded).partnerNotes).toEqual([note]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run lib/session.test.ts`

Expected: FAIL because `savePartnerNote` and `partnerNotes` do not exist.

- [ ] **Step 3: Add the note type, seed default, hydration default, and pure transform**

In `lib/seed.ts`, add `PartnerNote`, add `partnerNotes` to `SessionGraph`, and initialize it as `[]`.

In `lib/session.ts`, hydrate with:

```ts
partnerNotes: value.partnerNotes ?? [],
```

Clear notes when `applyColdScope` enters cold mode, and add:

```ts
export function savePartnerNote(graph: SessionGraph, note: PartnerNote): SessionGraph {
  const exists = graph.partnerNotes.some((item) => item.id === note.id);
  return {
    ...graph,
    partnerNotes: exists
      ? graph.partnerNotes.map((item) => item.id === note.id ? note : item)
      : [...graph.partnerNotes, note],
  };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run lib/session.test.ts`

Expected: all `lib/session.test.ts` tests PASS.

- [ ] **Step 5: Expose a guarded provider action**

Add `savePartnerNote(noteId: string | null, text: string)` to `SessionContextValue`. Guard it with `canEditSession`, trim the text, and call the pure transform with `viewer.name`, `new Date().toISOString()`, and either the existing ID or `partner-note-${Date.now()}`.

- [ ] **Step 6: Commit the data-model slice**

```powershell
git add lib/seed.ts lib/session.ts lib/session.test.ts components/session-provider.tsx
git commit -m "feat: persist partner session notes"
```

---

### Task 2: Make partner additions visible on Scope and Plan

**Files:**
- Modify: `app/scope/page.tsx`
- Modify: `app/plan/page.tsx`

**Interfaces:**
- Consumes: `graph.partnerNotes`
- Consumes: `savePartnerNote(noteId, text)`
- Consumes: existing `applyPattern` and `applyReusePilot`

- [ ] **Step 1: Add a prominent Partner additions card**

In seeded Scope, place a card after the imported account card. It must:

- Render existing partner notes with author and edit controls.
- Use a local draft and an **Add partner note** / **Save note** button.
- Label provenance as `Partner input · not from CRM`.
- Render the existing Pattern and Pilot spec choice chips.
- Disable all changes when `canEditSession` is false.

Remove the duplicate pattern/pilot adjustment controls from the collapsed **Evidence behind the questions** section while retaining source notes and contacts.

- [ ] **Step 2: Show notes as partner context on Plan**

After the Plan header, render a small card only when notes exist:

```tsx
<section aria-labelledby="partner-context-heading">
  <h2 id="partner-context-heading">Partner context</h2>
  {graph.partnerNotes.map((note) => (
    <article key={note.id}>
      <p>{note.text}</p>
      <p>Added by {note.author} · partner input</p>
    </article>
  ))}
</section>
```

Do not render these notes on Run under **What we heard**.

- [ ] **Step 3: Verify TypeScript and focused tests**

Run:

```powershell
npx tsc --noEmit
npx vitest run lib/session.test.ts
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit the partner-editing UI**

```powershell
git add app/scope/page.tsx app/plan/page.tsx
git commit -m "feat: expose partner additions on imported sessions"
```

---

### Task 3: Attribute self-service values to named confirmers

**Files:**
- Modify: `lib/session.ts`
- Modify: `lib/session.test.ts`
- Modify: `components/session-provider.tsx`
- Modify: `components/value-sprint-panel.tsx`

**Interfaces:**
- Produces: `updateValueConfirmer(graph, inputId, confirmer): SessionGraph`
- Produces: `useSession().updateValueConfirmer(inputId, confirmer)`

- [ ] **Step 1: Write the failing confirmer test**

```ts
describe("self-service input confirmation", () => {
  it("updates one confirmer without changing values, captures, or other confirmers", () => {
    const selfService = applyDeliveryMode(initialSessionGraph, "self-service");
    const updated = updateValueConfirmer(selfService, "claims", "Dana Reyes");

    expect(updated.valueInputs.find((item) => item.id === "claims")?.confirmedBy).toBe("Dana Reyes");
    expect(updated.valueInputs.find((item) => item.id === "delay")?.confirmedBy).toBeNull();
    expect(updated.valueInputs.map((item) => item.quantity)).toEqual(
      selfService.valueInputs.map((item) => item.quantity),
    );
    expect(updated.captures).toEqual(selfService.captures);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run lib/session.test.ts`

Expected: FAIL because `updateValueConfirmer` does not exist.

- [ ] **Step 3: Implement the pure transform and guarded provider action**

```ts
export function updateValueConfirmer(
  graph: SessionGraph,
  inputId: string,
  confirmer: string | null,
): SessionGraph {
  return {
    ...graph,
    valueInputs: graph.valueInputs.map((input) =>
      input.id === inputId ? { ...input, confirmedBy: confirmer } : input,
    ),
  };
}
```

Expose `updateValueConfirmer(inputId, confirmer)` from the provider and guard it with `canEditSession`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npx vitest run lib/session.test.ts`

Expected: PASS.

- [ ] **Step 5: Add self-service confirmer selectors**

In `ValueSprintPanel`, only for self-service:

- Render a native select for each input.
- Use `graph.attendees` as options.
- Use `input.confirmedBy ?? ""` as the value.
- Show `Choose who confirmed · not facilitator-verified` when empty.
- Show `Confirmed by <name> · not facilitator-verified` when selected.
- Disable the select when `canEditSession` is false.

Keep facilitated copy and layout unchanged.

- [ ] **Step 6: Commit the attribution slice**

```powershell
git add lib/session.ts lib/session.test.ts components/session-provider.tsx components/value-sprint-panel.tsx
git commit -m "feat: attribute self-service inputs to attendees"
```

---

### Task 4: Align next-step navigation

**Files:**
- Modify: `app/scope/page.tsx`
- Modify: `app/run/page.tsx`

**Interfaces:**
- Consumes: existing `seededComplete` and `coldComplete` booleans
- Produces: consistent top-right next-step actions

- [ ] **Step 1: Add the top-right Scope action**

Update the Scope heading row to render **Review session plan →** at the top right:

- Link to `/plan` when `mode === "seeded" ? seededComplete : coldComplete`.
- Otherwise render a disabled button.
- Add concise adjacent guidance: seeded mode names the missing confirmation; cold mode names missing company/attendees.

Retain **Start without the record** / **Use account record instead** as a secondary action near the heading.

- [ ] **Step 2: Remove bottom Scope navigation**

Remove the seeded **Ready for the session plan** action card and the cold sticky next-step footer. Keep any useful completion status next to the new top action; do not leave duplicate next links.

- [ ] **Step 3: Move Run navigation to the heading**

Place **Generate business case →** in the Run content heading row, aligned with the active question. Remove the bottom footer link. On narrow screens it wraps beneath the active-question heading.

- [ ] **Step 4: Verify routes compile**

Run:

```powershell
npx tsc --noEmit
npx eslint app/scope/page.tsx app/run/page.tsx
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit navigation**

```powershell
git add app/scope/page.tsx app/run/page.tsx
git commit -m "fix: align value-session next actions"
```

---

### Task 5: Full verification

**Files:**
- Review all modified files

- [ ] **Step 1: Run all automated checks**

```powershell
npx vitest run
npx tsc --noEmit
npx eslint .
npm run build
```

Expected: all tests pass, TypeScript and ESLint exit 0, and Next static export completes.

- [ ] **Step 2: Review persistence and evidence boundaries**

Run:

```powershell
git diff --check
git status --short
git diff HEAD~4 --stat
```

Confirm partner notes never enter `captures`, campaign copy is unchanged, and no storage key was bumped.

- [ ] **Step 3: Local walkthrough**

Verify:

1. Partner seeded Scope can add and edit a note.
2. Pattern and pilot spec are visibly adjustable.
3. Scope next action is disabled until complete, then opens Plan.
4. Plan shows partner context and its top-right Run action.
5. Self-service Run allows three numeric edits and three confirmer-name selections.
6. Run top-right action opens Artifact.
7. CPM controls remain read-only.

Do not push until the user reviews locally.
