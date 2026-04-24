"use client";

import type { ScoreResult as ScoreResultType } from "@/lib/model";

function tierColor(tier: ScoreResultType["tier"]) {
  switch (tier) {
    case "High":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "Medium":
      return "text-sky-700 bg-sky-50 border-sky-200";
    case "Low":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-rose-700 bg-rose-50 border-rose-200";
  }
}

export default function ScoreResult({ result }: { result: ScoreResultType }) {
  const p = result.probability * 100;
  const lo = result.probabilityCiLo * 100;
  const hi = result.probabilityCiHi * 100;

  const up = result.contributions.filter((c) => c.contribution > 0).slice(0, 3);
  const down = result.contributions
    .filter((c) => c.contribution < 0)
    .slice(0, 3);

  return (
    <section className="bg-panel/60 border border-rule rounded-lg p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        Translation likelihood
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-5xl font-mono font-semibold text-slate-100 tabular-nums">
          {Math.round(p)}
        </div>
        <div className="text-slate-500 text-sm">/ 100</div>
      </div>

      <div className="mt-3 relative h-2 bg-slate-800 rounded-full">
        <div
          className="absolute top-0 bottom-0 rounded-full bg-sky-200/70"
          style={{ left: `${lo}%`, width: `${Math.max(0, hi - lo)}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-sky-600 border-2 border-white shadow"
          style={{ left: `calc(${p}% - 6px)` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 tabular-nums">
        <span>0</span>
        <span>
          95% CI: {Math.round(lo)}–{Math.round(hi)}
        </span>
        <span>100</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${tierColor(
            result.tier
          )}`}
        >
          Tier: {result.tier}
        </span>
        <ModeBanner mode={result.mode} />
      </div>

      {(up.length > 0 || down.length > 0) && (
        <div className="mt-5 space-y-3">
          <ContribColumn title="Pushing up" items={up} color="emerald" />
          <ContribColumn title="Pushing down" items={down} color="rose" />
        </div>
      )}

      {result.missingFeatures.length > 0 && (
        <div className="mt-5 rounded-md bg-slate-800/40 border border-rule p-3 text-[12px] text-slate-600">
          <span className="font-medium text-slate-300">
            Adding these would refine the prediction:
          </span>{" "}
          {result.missingFeatures.map((f, i) => (
            <span key={f}>
              <code className="bg-panel/60 border border-rule px-1 py-0.5 rounded text-[11px]">
                {f}
              </code>
              {i < result.missingFeatures.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function ModeBanner({ mode }: { mode: "full" | "preHC" }) {
  if (mode === "full") {
    return (
      <span className="text-[11px] text-emerald-700">
        ✓ Full mode (n=13)
      </span>
    );
  }
  return (
    <span
      className="text-[11px] text-slate-500"
      title="Pre-HC mode: evidence section empty. Predicting likelihood of advancing to human-cell testing."
    >
      ⊘ Pre-HC mode (n=11)
    </span>
  );
}

function ContribColumn({
  title,
  items,
  color,
}: {
  title: string;
  items: { feature: string; contribution: number }[];
  color: "emerald" | "rose";
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => Math.abs(i.contribution)), 0.01);
  const barColor = color === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const textColor = color === "emerald" ? "text-emerald-700" : "text-rose-700";

  return (
    <div>
      <div className={`text-[11px] uppercase tracking-wider mb-1 ${textColor}`}>
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((c) => {
          const w = (Math.abs(c.contribution) / max) * 100;
          return (
            <li key={c.feature} className="text-[12px]">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate text-slate-300">{c.feature}</span>
                <span className="font-mono tabular-nums text-slate-600">
                  {c.contribution > 0 ? "+" : ""}
                  {c.contribution.toFixed(2)}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 bg-slate-800 rounded-full">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${w}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
