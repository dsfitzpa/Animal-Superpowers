"use client";

import { findSimilar, type FeatureMap } from "@/lib/model";
import type { TrainingCase } from "@/lib/training";

interface Props {
  query: FeatureMap;
  cases: TrainingCase[];
}

export default function SimilarCases({ query, cases }: Props) {
  const neighbors = findSimilar(query, cases, 3);
  return (
    <section className="bg-panel/60 border border-rule rounded-lg p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">
        Similar cases
      </div>
      <ul className="space-y-2">
        {neighbors.map((c) => (
          <li
            key={c.caseId}
            className="border border-rule rounded-md p-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-mono text-slate-500">
                {c.caseId}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  c.translated === 1
                    ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                    : "text-rose-700 border-rose-300 bg-rose-50"
                }`}
              >
                {c.translated === 1 ? "Translated" : "Did not translate"}
              </span>
            </div>
            <div className="text-[13px] text-slate-100 mt-0.5 leading-snug">
              {c.name.length > 60 ? c.name.slice(0, 60) + "…" : c.name}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              LOO pred:{" "}
              <span className="font-mono tabular-nums text-slate-300">
                {(c.looPredicted * 100).toFixed(0)}
              </span>
              /100
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
