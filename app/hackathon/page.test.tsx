import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { initialSessionGraph } from "@/lib/seed";
import { hackathonGuardCopy } from "@/lib/session";

const useSessionMock = vi.fn();

vi.mock("@/components/session-provider", () => ({
  useSession: () => useSessionMock(),
}));

import HackathonPage from "./page";

const viewers = {
  partner: { actor: "partner", name: "Ravi Menon", org: "CDW" },
  customer: { actor: "customer", name: "Dana Reyes", org: "Heartland Mutual Insurance" },
  pdm: { actor: "pdm", name: "Priya Raghavan", org: "Google" },
} as const;

function renderFor(actor: keyof typeof viewers, graph = initialSessionGraph) {
  useSessionMock.mockReturnValue({
    graph,
    brand: { partnerName: "CDW", accent: "#000" },
    viewer: viewers[actor],
    bookHackathon: vi.fn(),
    toggleSelected: vi.fn(),
    setPilotPick: vi.fn(),
    recordNotGoingAhead: vi.fn(),
    markPilotSigned: vi.fn(),
  });
  return renderToStaticMarkup(<HackathonPage />);
}

describe("hackathon guard", () => {
  it.each(["partner", "customer", "pdm"] as const)("tells %s to run a value session first and does not open the Heartland record", (actor) => {
    const empty = {
      ...initialSessionGraph,
      session: { ...initialSessionGraph.session, customerName: "", scopeMode: "cold" as const, focus: "hackathon" as const },
      agenda: initialSessionGraph.agenda.map((step) => ({ ...step, state: "upcoming" as const })),
      solutions: [],
    };
    const markup = renderFor(actor, empty);
    expect(markup).toContain(hackathonGuardCopy);
    expect(markup).toContain('href="/scope"');
    expect(markup).not.toContain("Heartland");
    expect(markup).not.toContain("Book the hackathon");
  });
});
