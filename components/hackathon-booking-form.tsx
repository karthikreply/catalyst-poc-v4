"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionGraph } from "@/lib/seed";
import { defaultHackathonDraft, defaultShowcaseAt, type HackathonDraft } from "@/lib/session";

export function HackathonBookingForm({
  graph,
  selectedTitles,
  canEdit,
  bookHackathon,
}: {
  graph: SessionGraph;
  selectedTitles: string[];
  canEdit: boolean;
  bookHackathon: (draft: HackathonDraft) => void;
}) {
  const [draft, setDraft] = useState(() => {
    const base = graph.hackathon ?? defaultHackathonDraft(graph);
    return {
      date: base.date,
      googleFacilitator: base.googleFacilitator,
      partnerSpecialist: base.partnerSpecialist,
      customerOwner: base.customerOwner,
      question: base.question,
      // Empty until edited: the showcase follows the date to the afternoon of the third day.
      showcaseAt: base.showcaseAt ?? "",
    };
  });
  const dateRef = useRef<HTMLLabelElement>(null);
  const [needsDate, setNeedsDate] = useState(false);
  const showcaseAt = draft.showcaseAt || defaultShowcaseAt(draft.date);
  const detailsReady = Boolean(
    draft.googleFacilitator.trim()
    && draft.partnerSpecialist.trim()
    && draft.customerOwner.trim()
    && draft.question.trim(),
  );

  function book() {
    if (!draft.date.trim()) {
      setNeedsDate(true);
      dateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("hackathon-date")?.focus();
      return;
    }
    bookHackathon({ ...draft, showcaseAt });
  }

  return (
    <section className="mx-auto mt-5 max-w-4xl rounded-sm border border-black/10 bg-white p-6" aria-label="Book the hackathon">
      <h2 className="text-lg font-semibold text-black">Book the three-day hackathon</h2>
      <p className="mt-2 text-sm leading-6 text-black/75">
        The three days scope a six-week pilot on these solutions.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/85">
        {selectedTitles.map((title) => (
          <li key={title}>{title}</li>
        ))}
      </ul>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label ref={dateRef} className={`grid gap-1.5 rounded-sm text-sm ${needsDate ? "bg-[color-mix(in_srgb,var(--brand-accent)_14%,white)] p-3 ring-2 ring-[var(--brand-accent)]" : ""}`}>
          <span className="text-xs font-medium text-black/70">Hackathon date</span>
          <Input
            id="hackathon-date"
            type="date"
            value={draft.date}
            disabled={!canEdit}
            onChange={(event) => {
              setNeedsDate(false);
              setDraft((current) => ({ ...current, date: event.target.value }));
            }}
            aria-label="Hackathon date"
            aria-invalid={needsDate}
          />
          {needsDate && <span className="text-xs font-medium text-black">Choose the date on the calendar.</span>}
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-black/70">Solution showcase</span>
          <Input
            type="datetime-local"
            value={showcaseAt}
            disabled={!canEdit}
            onChange={(event) => setDraft((current) => ({ ...current, showcaseAt: event.target.value }))}
            aria-label="Solution showcase"
          />
          <span className="text-xs text-black/48">Afternoon of the third day unless you move it.</span>
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="text-xs font-medium text-black/70">Question the hackathon must answer</span>
          <Input
            value={draft.question}
            disabled={!canEdit}
            onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
            aria-label="Question the hackathon must answer"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-black/70">Platform facilitator</span>
          <Input
            value={draft.googleFacilitator}
            disabled={!canEdit}
            onChange={(event) => setDraft((current) => ({ ...current, googleFacilitator: event.target.value }))}
            aria-label="Platform facilitator"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-black/70">Partner specialist</span>
          <Input
            value={draft.partnerSpecialist}
            disabled={!canEdit}
            onChange={(event) => setDraft((current) => ({ ...current, partnerSpecialist: event.target.value }))}
            aria-label="Partner specialist"
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="text-xs font-medium text-black/70">Customer owner</span>
          <Input
            value={draft.customerOwner}
            disabled={!canEdit}
            onChange={(event) => setDraft((current) => ({ ...current, customerOwner: event.target.value }))}
            aria-label="Customer owner"
          />
        </label>
      </div>
      <div className="mt-5">
        <Button
          type="button"
          disabled={!canEdit || !detailsReady}
          className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)]"
          onClick={book}
        >
          Book hackathon
        </Button>
      </div>
    </section>
  );
}
