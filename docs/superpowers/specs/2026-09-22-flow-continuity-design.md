# Flow continuity design

## Goal

Fix four local-review defects without changing the established partner workflow or the vendor Material surfaces outside funding:

1. Keep the partner in a partner-branded experience while preparing a DAF claim.
2. Make “Start without the record” reversible.
3. Explain which attendee roles the pattern recognises.
4. Keep the next-step action visible while cold scope is being completed.

## Funding

`/funding` is actor-aware:

- Partner: partner-branded claim preparation, reached from the artifact and returning to it.
- PDM/CPM: Material vendor-review surface.

The claim remains illustrative and cannot be submitted. Changing actor on `/funding` changes the lens without losing session evidence.

## Scope-mode restoration

Before the first seeded-to-cold transition, save the current seeded graph locally. Cold-mode edits must not overwrite that backup. “Use account record instead” restores the backup, falling back to the initial seeded graph only if no valid backup exists.

## Role guidance

Keep role entry free-text. Show the six recognised pattern-role examples and, beneath each completed role field, either:

- `Matched as <role>`, or
- `Not matched to a required pattern role`.

The existing missing-role panel remains the authoritative gap list.

## Completion and navigation

Cold scope always shows a completion panel beneath the form. It lists whether company details and at least three complete attendees are present. “Review session plan” is disabled until both conditions pass and becomes the prominent next action when ready.

## Verification

- Unit tests cover seeded snapshot restoration, role matching, and actor-aware shell treatment for funding.
- Local checks cover seeded → cold → seeded restoration, cold form progression, artifact → funding → artifact continuity, all three actor lenses, persistence after reload, keyboard focus, lint, typecheck, tests, and static build.
- No push occurs without explicit user approval.
