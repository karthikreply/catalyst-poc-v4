import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialSessionGraph } from "@/lib/seed";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("@/components/session-provider", () => ({
  useSession: useSessionMock,
}));

import { ValueSprintPanel } from "./value-sprint-panel";

describe("ValueSprintPanel confirmer status", () => {
  beforeEach(() => {
    useSessionMock.mockReset();
  });

  it("keeps a stored non-attendee confirmer selectable and describes the select with its status", () => {
    useSessionMock.mockReturnValue({
      graph: {
        ...initialSessionGraph,
        session: { ...initialSessionGraph.session, delivery: "self-service" },
        valueInputs: initialSessionGraph.valueInputs.map((input) =>
          input.id === "claims" ? { ...input, confirmedBy: "Former Attendee" } : input,
        ),
      },
      updateValue: vi.fn(),
      updateValueConfirmer: vi.fn(),
      canEditSession: true,
      viewer: { actor: "partner", name: "Ravi Menon", org: "CDW" },
    });

    const markup = renderToStaticMarkup(<ValueSprintPanel />);

    expect(markup).toContain('id="claims-confirmer-status"');
    expect(markup).toContain('aria-describedby="claims-confirmer-status"');
    expect(markup).toContain("Confirmed by Former Attendee · not facilitator-verified");
    expect(markup).toContain('<option value="Former Attendee" selected="">Former Attendee</option>');
  });
});
