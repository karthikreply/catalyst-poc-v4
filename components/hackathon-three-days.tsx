"use client";

import { useSession } from "@/components/session-provider";
import { UnavailableControl } from "@/components/unavailable-control";
import { SolutionProductList, ThreeDayShapeList } from "@/components/what-the-three-days-will-be";
import type { SessionGraph } from "@/lib/seed";
import { bookedSolutionPains, catalogSolutionById, showcaseLabel } from "@/lib/session";
import { cn } from "@/lib/utils";

/** Booked three days: the solutions and what the days will be, then the date, showcase, and pilot choice. */
export function HackathonThreeDays({ graph, className }: { graph: SessionGraph; className?: string }) {
  const { brand } = useSession();
  if (!graph.hackathon?.booked) return null;
  const rows = bookedSolutionPains(graph);
  const pick = graph.outcome.pilotPick;
  const showcase = graph.hackathon.showcaseAt ? showcaseLabel(graph.hackathon.showcaseAt) : "Not set";

  return (
    <section
      className={cn("rounded-sm border border-black/20 bg-white p-5 md:p-6", className)}
      aria-labelledby="hackathon-three-days-title"
    >
      <h2 id="hackathon-three-days-title" className="text-lg font-semibold text-black">
        What the three days produce
      </h2>
      <p className="mt-1 text-sm leading-6 text-black/75">
        The team builds in the customer&apos;s account with Google Cloud and Workspace. This demo shows the scope, not the build.
      </p>

      <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
        {rows.map((row) => {
          const picked = pick === row.id;
          const products = catalogSolutionById(row.id, graph)?.products ?? [];
          return (
            <li key={row.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-black">{row.title}</p>
                {picked && (
                  <span className="rounded-sm border border-black/25 bg-[#f4f4f1] px-2 py-0.5 text-xs font-semibold text-black">
                    Pilot
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-black/70">{row.pain}</p>
              <SolutionProductList title={row.title} products={products} />
            </li>
          );
        })}
      </ul>

      <h3 id="three-day-shape-title" className="mt-5 text-base font-semibold text-black">
        What the three days will be.
      </h3>
      <ThreeDayShapeList labelledBy="three-day-shape-title" />

      <p className="mt-5 text-sm font-semibold text-black">Date · {graph.hackathon.date}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
        <p className="text-sm text-black">
          <span className="font-semibold">Solution showcase</span> · {showcase}
        </p>
        <UnavailableControl
          label="Send reminders"
          owner={brand.partnerName}
          explanation="The calendar hold carries the invite. This demo does not send mail."
        />
      </div>
    </section>
  );
}
