import { describe, expect, it } from "vitest";

import {
  deriveKarenObservation,
  heartlandAccountRecord,
} from "./accountRecord";

describe("Heartland account record", () => {
  it("contains scruffy attributed evidence and a stale opportunity", () => {
    expect(heartlandAccountRecord.notes.some((note) => note.partial)).toBe(true);
    expect(heartlandAccountRecord.opportunity.closeDatePushes).toBe(2);
    expect(heartlandAccountRecord.opportunity.weeksSinceUpdate).toBe(6);
    expect(
      heartlandAccountRecord.contacts.find(
        (contact) => contact.name === "Karen Whitfield",
      ),
    ).toMatchObject({ economicBuyer: true, activityLogged: false });
  });

  it("derives the Karen inference only when record evidence exists", () => {
    const observation = deriveKarenObservation(heartlandAccountRecord);
    expect(observation).toContain("no logged activity");
    expect(observation).toContain("close date has slipped twice");
    expect(observation).toContain("likely related");
    expect(deriveKarenObservation(null)).toBeNull();
  });
});
