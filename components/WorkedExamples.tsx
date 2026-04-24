"use client";

import { trainingCases } from "@/lib/training";
import { score } from "@/lib/model";

const EXAMPLE_IDS = ["P03", "P05", "N12", "P26"];

export default function WorkedExamples() {
  const cards = EXAMPLE_IDS.map((id) => {
    const c = trainingCases.find((x) => x.caseId === id);
    if (!c) return null;
    const r = score(c.features);
    const topUp = r.contributions.find((c) => c.contribution > 0);
    const topDown = r.contributions.find((c) => c.contribution < 0);
    return { c, r, topUp, topDown };
  }).filter(Boolean) as {
    c: (typeof trainingCases)[number];
    r: ReturnType<typeof score>;
    topUp?: { feature: string; contribution: number };
    topDown?: { feature: string; contribution: number };
  }[];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {cards.map(({ c, r, topUp, topDown }) => (
        <div
          key={c.caseId}
          className="border border-rule rounded-md p-3 bg-panel/60"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-slate-500">{c.caseId}</div>
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
            {c.name}
          </div>
          <div className="mt-2 text-sm">
            predicted{" "}
            <span className="font-mono font-semibold tabular-nums">
              {(r.probability * 100).toFixed(0)}
            </span>
            /100
            <span className="ml-2 text-[11px] text-slate-500 tabular-nums">
              95% CI {(r.probabilityCiLo * 100).toFixed(0)}–
              {(r.probabilityCiHi * 100).toFixed(0)}
            </span>
          </div>
          <div className="mt-2 text-[11.5px] text-slate-600 space-y-0.5">
            {topUp && (
              <div>
                <span className="text-emerald-700">▲</span>{" "}
                <span className="text-slate-300">{topUp.feature}</span>{" "}
                <span className="font-mono">
                  {topUp.contribution > 0 ? "+" : ""}
                  {topUp.contribution.toFixed(2)}
                </span>
              </div>
            )}
            {topDown && (
              <div>
                <span className="text-rose-700">▼</span>{" "}
                <span className="text-slate-300">{topDown.feature}</span>{" "}
                <span className="font-mono">
                  {topDown.contribution.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
