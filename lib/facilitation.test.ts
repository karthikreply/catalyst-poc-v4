import { describe, expect, it } from "vitest";

import { nextQuestionSuggestion } from "./facilitation";
import { initialSessionGraph } from "./seed";

describe("nextQuestionSuggestion", () => {
  it("leaves capture count and contents unchanged when invoked", () => {
    const capturesBefore = structuredClone(initialSessionGraph.captures);

    nextQuestionSuggestion(initialSessionGraph, "constraints", null);

    expect(initialSessionGraph.captures).toEqual(capturesBefore);
    expect(initialSessionGraph.captures).toHaveLength(capturesBefore.length);
  });

  it("uses the active step and its latest capture without attaching a name", () => {
    const graph = {
      ...initialSessionGraph,
      captures: [
        ...initialSessionGraph.captures,
        {
          id: "cap-audit-detail",
          sessionId: initialSessionGraph.session.id,
          stepId: "constraints",
          attributedTo: "Robert Osei",
          text: "A reviewer must be able to see the source field beside every extracted value.",
          capturedAt: "2026-09-21T10:30:00-05:00",
        },
      ],
    };

    const suggestion = nextQuestionSuggestion(graph, "constraints", null);

    expect(suggestion).toBe("What counts as an audit trail — a log of what the model extracted, or a human signature on each decision?");
    expect(suggestion).not.toMatch(/Robert Osei|Alex Chen/);
  });

  it("never repeats the same suggestion twice in a row", () => {
    const first = nextQuestionSuggestion(initialSessionGraph, "shape-the-pilot", null);
    const second = nextQuestionSuggestion(initialSessionGraph, "shape-the-pilot", first);

    expect(second).not.toBe(first);
  });

  it("suggests the board-slide number question for the closing step", () => {
    const graph = {
      ...initialSessionGraph,
      session: { ...initialSessionGraph.session, closeStyle: "board-slide" as const },
    };

    expect(nextQuestionSuggestion(graph, "owner-and-ask", null)).toBe(
      "If your board asked what changed, what's the one number you'd lead with?",
    );
  });
});
