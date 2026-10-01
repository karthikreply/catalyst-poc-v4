# Single Partner Context and Exact Claims Implementation Plan

**Goal:** Replace append-only partner notes with one editable context and add an exact claims-per-day option.

**Constraints:** Keep `partnerNotes` storage backward-compatible, never write context to captures, preserve the three existing claims choices, and deploy only to `catalyst-poc-v2`.

## Task 1: Single partner context

1. Add failing tests proving `savePartnerNote` replaces the collection and hydration retains only the newest persisted note.
2. Implement normalization in `hydrateSessionGraph` and replacement in `savePartnerNote`.
3. Replace the note list/add/edit UI with one textarea and **Save context** action.
4. Update Plan to render at most one context.
5. Run focused tests.

## Task 2: Exact claims volume

1. Add failing tests for valid exact claims arithmetic and invalid exact values.
2. Extend `ClaimsVolumeChoice` with `exact`.
3. Add a pure `applyExactClaimsVolume` graph transform and guarded provider action.
4. Add the `Enter exact number` choice and numeric input on seeded Scope.
5. Require a valid exact quantity before enabling the Scope next action.
6. Preserve preset/range/unconfirmed behavior and verify Artifact/Funding copy.

## Task 3: Verification and deployment

1. Run all tests, TypeScript, ESLint, and the production build.
2. Review the feature diff for evidence separation and storage compatibility.
3. Commit and push to `catalyst-poc-v2/main`.
4. Wait for GitHub Pages and verify `/`, `/scope/`, and `/run/`.
