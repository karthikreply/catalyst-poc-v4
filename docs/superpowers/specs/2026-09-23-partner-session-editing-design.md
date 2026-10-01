# Partner Session Editing Design

## Goal

Make a partner's contribution to an imported value session obvious without allowing partner edits to masquerade as CRM facts or customer testimony. Improve the existing self-service Run view so each business-case input records who confirmed it. Put every primary next-step action in the same top-right location.

Campaign entry, invitation delivery, authentication, and a new customer actor remain outside this change.

## Imported Account Scope

The imported Heartland account and opportunity cards remain read-only source evidence. The seeded Scope page adds a prominent **Partner additions** card in the main left column.

The card contains:

- Partner-authored notes that Ravi can add and edit.
- The existing matched-pattern adjustment.
- The existing reuse/start-fresh pilot-spec adjustment.
- Clear provenance identifying notes as partner input, not CRM evidence.

Pattern and pilot-spec controls move out of the collapsed evidence details so users can discover them without expanding a disclosure. CRM notes, contacts, revenue, opportunity data, and the generated account narrative stay read-only.

## Data Model and Persistence

`SessionGraph` gains a `partnerNotes` collection. Each note has an ID, author, text, and update timestamp. Notes are stored with the existing graph in `catalyst-session-graph-v3`.

Hydration supplies an empty collection when an existing v3 graph has no `partnerNotes`, so the change does not require a storage-key bump. Seeded-scope snapshots preserve notes. Cold sessions do not inherit seeded partner notes; restoring the seeded record restores its saved notes.

Partner notes never enter `captures`, never affect capture count, and are not rendered as attributed statements under **What we heard**. Plan shows them as partner-provided session context.

Partner and PDM actors follow the existing editable-session permission. CPM remains read-only.

## Self-Service Input Confirmation

The existing self-service Run screen remains the editing surface; no new actor or invite route is introduced.

For each value input—claims per day, avoidable delay, and handling cost—the self-service view adds a confirmer selector sourced from session attendees. Changing a confirmer updates only that input's `confirmedBy` field. The supporting copy becomes:

`Confirmed by <name> · not facilitator-verified`

The numeric inputs remain editable as they are today. Facilitated-session presentation remains unchanged.

## Navigation

Scope, Plan, and Run use one consistent top-right primary-action position:

- Scope: **Review session plan →**
- Plan: **Open live session →**
- Run: **Generate business case →**

The Scope action is always visible. It is disabled until the appropriate seeded or cold Scope requirements are complete and is paired with concise completion guidance. Existing bottom next-step actions on Scope and Run are removed to avoid duplicate navigation.

Responsive layouts keep the action adjacent to or directly below the page heading while preserving source order.

## Testing

Tests are written before implementation and cover:

- Adding and updating a partner note without changing captures.
- Hydrating an older v3 graph with no partner notes.
- Preserving seeded notes through cold-scope switch and seeded restore.
- Updating one input confirmer without changing quantities or other confirmers.
- Respecting existing edit permissions through provider guards.

The complete Vitest suite, TypeScript check, ESLint, and production build must pass.
