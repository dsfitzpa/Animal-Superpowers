"use client";

import type { SpeciesDataset } from "@/lib/types";

interface Props {
  dataset: SpeciesDataset;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
  speciesMatchCounts: Record<string, number>;
}

export default function FilterSidebar({
  dataset,
  selected,
  onToggle,
  onClear,
  speciesMatchCounts,
}: Props) {
  const entries = Object.entries(dataset.superpowers);

  return (
    <aside className="w-full lg:w-72 shrink-0 lg:border-r lg:border-rule lg:pr-6 lg:pl-2 pt-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-[0.18em] text-slate-400">
          Superpower filter
        </h2>
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
          >
            clear
          </button>
        )}
      </div>

      <p className="text-[11px] leading-snug text-slate-500 mb-4">
        Select one or more traits to highlight species on the tree.
      </p>

      <ul className="space-y-1.5">
        {entries.map(([key, meta]) => {
          const isOn = selected.has(key);
          const n = speciesMatchCounts[key] ?? 0;
          return (
            <li key={key}>
              <button
                onClick={() => onToggle(key)}
                className={`group w-full flex items-start gap-2 rounded px-2 py-1.5 text-left transition ${
                  isOn ? "bg-slate-800/60" : "hover:bg-slate-900/60"
                }`}
                aria-pressed={isOn}
              >
                <span
                  className="mt-1 inline-block h-3 w-3 shrink-0 rounded-sm border"
                  style={{
                    background: isOn ? meta.color : "transparent",
                    borderColor: meta.color,
                  }}
                />
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-[13px] ${
                        isOn ? "text-slate-100" : "text-slate-300"
                      }`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {n}
                    </span>
                  </span>
                  <span className="block text-[11px] text-slate-500 leading-snug mt-0.5">
                    {meta.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
