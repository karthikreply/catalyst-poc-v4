"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function UnavailableControl({
  label,
  owner,
  explanation,
}: {
  label: string;
  owner: string;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button type="button" variant="outline" aria-disabled="true" className="border-black/25" onClick={() => setOpen((value) => !value)}>
        {label}
      </Button>
      {open && (
        <p className="mt-2 text-sm leading-6 text-black/58">
          {explanation} Owner: {owner}. This demo does not submit, provision, or connect.
        </p>
      )}
    </div>
  );
}
