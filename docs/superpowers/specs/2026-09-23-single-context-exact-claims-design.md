# Single Partner Context and Exact Claims Design

## Goal

Simplify partner enrichment to one editable context value and let a partner enter an exact claims-per-day number without removing the existing quick choices.

This change applies only to `catalyst-poc-v2`.

## Partner Context

The seeded Scope page shows one **Partner context** textarea. Saving updates the same context rather than appending cards.

The persisted `partnerNotes` field remains for backward compatibility, but it is normalized to at most one item. When an existing graph contains multiple notes, hydration keeps the most recently updated note. Saving context replaces the collection with one note. Plan displays that single context. Captures remain unchanged.

## Exact Claims

Scope keeps the existing `~400 a day`, `250–500 a day`, and `Not confirmed yet` choices and adds `Enter exact number`.

Selecting the exact option shows a numeric claims-per-day input. A finite positive whole number:

- becomes the claims quantity,
- participates in daily and annual calculations,
- produces point-estimate Scope and Artifact copy,
- and satisfies the claims portion of Scope completion.

An empty, non-finite, zero, or negative exact value does not complete Scope and does not produce a point estimate.

## Tests

Tests cover:

- saving context replaces rather than appends,
- hydration collapses multiple old notes to the newest,
- notes and captures remain separate,
- exact claims update quantity and arithmetic,
- invalid exact values do not complete the graph,
- existing preset and range behaviors remain unchanged.
