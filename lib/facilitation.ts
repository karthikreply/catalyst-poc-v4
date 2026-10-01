import type { Capture, SessionGraph } from "./seed";

const questionsByStep: Record<string, string[]> = {
  "where-it-hurts": [
    "Which handoff creates the longest wait, and what is happening during that time?",
    "Who feels this problem most directly when volume rises?",
    "What work gets deferred or rushed when the current process backs up?",
  ],
  "volume-and-cost": [
    "Which input would finance challenge first, and who can confirm it?",
    "How much of this volume follows the same path versus needing exception handling?",
    "What cost is missing if we count handling time but not delay or rework?",
  ],
  constraints: [
    "What evidence would compliance need before allowing this into a live workflow?",
    "Which decisions must remain human, even if extraction is assisted?",
    "What data must stay out of the pilot entirely?",
  ],
  "shape-the-pilot": [
    "What result after six weeks would be strong enough to continue funding?",
    "What is the smallest representative sample that would still make the result credible?",
    "Which failure mode must the pilot expose rather than design around?",
  ],
  "owner-and-ask": [
    "Who can commit the people and data needed to start the pilot?",
    "What exactly needs approval, and by when?",
    "Who will carry the funding ask if the economic buyer is not in the room?",
  ],
};

function contextualQuestion(stepId: string, capture: Capture | undefined) {
  if (!capture) return null;
  const text = capture.text.toLowerCase();

  if (stepId === "constraints" && /audit|source field|reviewer|log/.test(text)) {
    return "What counts as an audit trail — a log of what the model extracted, or a human signature on each decision?";
  }
  if (stepId === "constraints" && /handwrit|margin|redact/.test(text)) {
    return "How should handwritten or redacted content be handled when the extraction is uncertain?";
  }
  if (stepId === "where-it-hurts" && /overtime|hiring|capacity/.test(text)) {
    return "What happens to service levels when overtime is no longer available?";
  }
  if (stepId === "where-it-hurts" && /day|wait|manual|intake/.test(text)) {
    return "Which part of that wait is active work, and which part is the claim sitting untouched?";
  }
  if (stepId === "volume-and-cost" && /claim|volume|day/.test(text)) {
    return "How much does that volume vary between a normal day and a peak day?";
  }
  if (stepId === "volume-and-cost" && /cost|dollar|hour|minute/.test(text)) {
    return "Does that cost include review and rework, or only the first handling pass?";
  }
  if (stepId === "shape-the-pilot" && /500|sample|claim|data/.test(text)) {
    return "What would make that sample representative enough for the result to be trusted?";
  }
  if (stepId === "shape-the-pilot" && /success|prove|result|accuracy/.test(text)) {
    return "Who decides whether that result is good enough to move forward?";
  }
  if (stepId === "owner-and-ask" && /owner|team|prepare/.test(text)) {
    return "What can that owner commit without waiting for another approval?";
  }
  if (stepId === "owner-and-ask" && /fund|budget|approve|ask/.test(text)) {
    return "What evidence will the approver need alongside the funding request?";
  }
  return null;
}

export function nextQuestionSuggestion(
  graph: SessionGraph,
  stepId: string,
  previousSuggestion: string | null,
) {
  if (stepId === "owner-and-ask" && graph.session.closeStyle === "board-slide") {
    return "If your board asked what changed, what's the one number you'd lead with?";
  }
  const latestCapture = [...graph.captures].reverse().find((capture) => capture.stepId === stepId);
  const contextual = contextualQuestion(stepId, latestCapture);
  const candidates = [
    ...(contextual ? [contextual] : []),
    ...(questionsByStep[stepId] ?? ["What do we still need to learn before moving to the next step?"]),
  ];

  return candidates.find((question) => question !== previousSuggestion) ?? candidates[0];
}
