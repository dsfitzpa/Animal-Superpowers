"use client";

import { useMemo, useState } from "react";
import { dataset } from "@/lib/data";
import MammalTree from "@/components/MammalTree";
import FilterSidebar from "@/components/FilterSidebar";
import SpeciesDetail from "@/components/SpeciesDetail";

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openSpecies, setOpenSpecies] = useState<string | null>(null);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clear = () => setSelected(new Set());

  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const key of Object.keys(dataset.superpowers)) counts[key] = 0;
    for (const rec of Object.values(dataset.species_data)) {
      for (const p of rec.superpowers) {
        if (counts[p] !== undefined) counts[p] += 1;
      }
    }
    return counts;
  }, []);

  const highlightedList = useMemo(() => {
    if (selected.size === 0) {
      // default: surface all curated species (those with non-empty reviews)
      return Object.entries(dataset.species_data)
        .filter(([, v]) => v.superpowers.length > 0)
        .map(([k]) => k);
    }
    return Object.entries(dataset.species_data)
      .filter(([, v]) => v.superpowers.some((p) => selected.has(p)))
      .map(([k]) => k);
  }, [selected]);

  return (
    <main className="min-h-screen">
      <section className="border-b border-rule">
        <div className="max-w-[1400px] mx-auto px-5 py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              A therapeutic mammal tree
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-slate-100 mt-1">
              Mammals with biological superpowers
            </h1>
            <p className="text-slate-400 text-[13px] md:text-sm mt-1 max-w-2xl">
              Extreme adaptations — extended lifespan, viral tolerance, cancer
              resistance, limb regeneration — and the human therapeutic targets
              their biology suggests. Open any citation and click{" "}
              <span className="text-sky-300">Score for translation →</span> to
              run the Translational Discovery model.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-5 py-6 flex flex-col lg:flex-row gap-6">
        <FilterSidebar
          dataset={dataset}
          selected={selected}
          onToggle={toggle}
          onClear={clear}
          speciesMatchCounts={matchCounts}
        />

        <section className="flex-1 min-w-0">
          <MammalTree
            dataset={dataset}
            selectedSuperpowers={selected}
            onSelectSpecies={(name) => setOpenSpecies(name)}
            highlightedSpecies={openSpecies}
          />

          <div className="mt-4 text-center text-[11px] text-slate-500">
            Click a species to see its curated literature review and human
            therapeutic targets.
          </div>

          <HighlightList
            names={highlightedList}
            onOpen={(n) => setOpenSpecies(n)}
          />
        </section>
      </div>

      <section
        id="about"
        className="border-t border-rule mt-10 bg-panel/40"
      >
        <div className="max-w-[1100px] mx-auto px-5 py-10 text-[13px] text-slate-400 leading-relaxed space-y-4">
          <h2 className="font-serif text-xl text-slate-100">About the data</h2>
          <p>
            Every species in this tree is curated from primary peer-reviewed
            literature. Each superpower annotation links to the paper(s) that
            describe the mechanism and, where plausible, the human pathway it
            points toward. Citations resolve via <code>doi.org</code> — click
            through to the source.
          </p>
          <p>
            This is a hackathon prototype, not a clinical resource. Human
            therapeutic targets are drawn from the comparative-biology
            literature and are speculative — they identify pathways worth
            studying, not approved therapies.
          </p>
          <p>
            Inspired by the radial mammal phylogeny from the{" "}
            <a
              className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
              href="https://zoonomiaproject.org/the-mammal-tree-view/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Zoonomia Project
            </a>
            .
          </p>
        </div>
      </section>

      <SpeciesDetail
        dataset={dataset}
        speciesName={openSpecies}
        onClose={() => setOpenSpecies(null)}
      />
    </main>
  );
}

function HighlightList({
  names,
  onOpen,
}: {
  names: string[];
  onOpen: (n: string) => void;
}) {
  if (names.length === 0) return null;
  return (
    <div className="mt-8">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">
        Highlighted species
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {names.map((n) => {
          const rec = (dataset as { species_data: Record<string, { common: string; headline: string }> }).species_data[n];
          if (!rec) return null;
          return (
            <li key={n}>
              <button
                onClick={() => onOpen(n)}
                className="w-full text-left p-3 border border-rule hover:border-slate-600 rounded bg-panel/60 transition"
              >
                <div className="text-slate-100 text-[13px]">{rec.common}</div>
                <div className="italic text-slate-500 text-[11px]">{n}</div>
                <div className="text-slate-400 text-[12px] mt-1 leading-snug">
                  {rec.headline}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
