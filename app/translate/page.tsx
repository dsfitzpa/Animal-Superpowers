"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ScoreForm, { type FeatureState } from "@/components/ScoreForm";
import ScoreResult from "@/components/ScoreResult";
import SimilarCases from "@/components/SimilarCases";
import FeatureImportanceChart from "@/components/FeatureImportanceChart";
import CaseSpectrum from "@/components/CaseSpectrum";
import WorkedExamples from "@/components/WorkedExamples";
import { score, type FeatureMap, type FeatureName } from "@/lib/model";
import {
  trainingCases,
  speciesReviewToCase,
  modalityOf,
  type Modality,
  type TrainingCase,
} from "@/lib/training";
import { dataset as speciesDataset } from "@/lib/data";

const defaultFeatures: FeatureState = {
  mechanism_clarity: 5,
  ortholog_conservation: 5,
  target_druggability: 5,
  pathway_redundancy: 5,
  effect_size_reported: 5,
  is_secreted_product: 0,
  is_small_molecule_or_peptide: 0,
  requires_expression_system: 0,
  phenotype_is_organismal: 0,
  evidenceProvided: false,
  cross_species_consistency: 5,
  human_cell_validation: 5,
  assay_translatability: 5,
  regulatory_precedent: 5,
};

function featuresFromCase(c: TrainingCase): FeatureState {
  const f = c.features;
  return {
    mechanism_clarity: f.mechanism_clarity ?? 5,
    ortholog_conservation: f.ortholog_conservation ?? 5,
    target_druggability: f.target_druggability ?? 5,
    pathway_redundancy: f.pathway_redundancy ?? 5,
    effect_size_reported: f.effect_size_reported ?? 5,
    is_secreted_product: (f.is_secreted_product as 0 | 1) ?? 0,
    is_small_molecule_or_peptide:
      (f.is_small_molecule_or_peptide as 0 | 1) ?? 0,
    requires_expression_system:
      (f.requires_expression_system as 0 | 1) ?? 0,
    phenotype_is_organismal: (f.phenotype_is_organismal as 0 | 1) ?? 0,
    evidenceProvided:
      f.human_cell_validation !== undefined &&
      f.assay_translatability !== undefined,
    cross_species_consistency: f.cross_species_consistency ?? 5,
    human_cell_validation: f.human_cell_validation ?? 5,
    assay_translatability: f.assay_translatability ?? 5,
    regulatory_precedent: f.regulatory_precedent ?? 5,
  };
}

function toFeatureMap(s: FeatureState): FeatureMap {
  const m: FeatureMap = {
    mechanism_clarity: s.mechanism_clarity,
    ortholog_conservation: s.ortholog_conservation,
    target_druggability: s.target_druggability,
    pathway_redundancy: s.pathway_redundancy,
    effect_size_reported: s.effect_size_reported,
    is_secreted_product: s.is_secreted_product,
    is_small_molecule_or_peptide: s.is_small_molecule_or_peptide,
    requires_expression_system: s.requires_expression_system,
    phenotype_is_organismal: s.phenotype_is_organismal,
  };
  if (s.evidenceProvided) {
    m.cross_species_consistency = s.cross_species_consistency;
    m.human_cell_validation = s.human_cell_validation;
    m.assay_translatability = s.assay_translatability;
    m.regulatory_precedent = s.regulatory_precedent;
  }
  return m;
}

type Tab = "evaluate" | "explore";

export default function TranslatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <TranslateInner />
    </Suspense>
  );
}

function TranslateInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("evaluate");
  const [features, setFeatures] = useState<FeatureState>(defaultFeatures);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  // Prefill from URL params on mount / change
  useEffect(() => {
    const caseId = params.get("caseId");
    const species = params.get("species");
    const sp = params.get("sp");

    if (caseId) {
      const c = trainingCases.find((x) => x.caseId === caseId);
      if (c) {
        setFeatures(featuresFromCase(c));
        setContextBanner(
          `Loaded from training case ${c.caseId}: ${c.name}`
        );
        return;
      }
    }
    if (species) {
      const key = sp ? `${species}::${sp}` : "";
      const mapped = key ? speciesReviewToCase[key] : undefined;
      if (mapped) {
        const c = trainingCases.find((x) => x.caseId === mapped);
        if (c) {
          setFeatures(featuresFromCase(c));
          const spMeta = sp ? speciesDataset.superpowers[sp]?.label : null;
          setContextBanner(
            `Prefilled from matched training case ${c.caseId} for ${species}` +
              (spMeta ? ` — ${spMeta}` : "")
          );
          return;
        }
      }
      const spMeta = sp ? speciesDataset.superpowers[sp]?.label : null;
      setFeatures(defaultFeatures);
      setContextBanner(
        `Scoring: ${species}${spMeta ? ` — ${spMeta}` : ""} · features not pre-mapped · adjust the sliders below.`
      );
      return;
    }
    setContextBanner(null);
  }, [params]);

  const featureMap = useMemo(() => toFeatureMap(features), [features]);
  const result = useMemo(() => score(featureMap), [featureMap]);

  return (
    <main className="max-w-[1200px] mx-auto px-5 py-8 text-slate-200">
      <section>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
          Translational Discovery
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-slate-100 mt-1">
          Will this animal finding translate to a human therapeutic?
        </h1>
        <p className="text-slate-400 text-[13px] md:text-sm mt-1 max-w-3xl">
          A logistic regression trained on 61 curated historical cases scores
          the likelihood that a biological phenomenon in an animal will reach
          an approved drug or sustained clinical use. Provide what you know;
          the model drops missing features and reports a 95% confidence
          interval on the coefficients.
        </p>
      </section>

      {contextBanner && (
        <div className="mt-4 px-4 py-2.5 rounded border border-sky-900/60 bg-sky-950/40 text-sky-200 text-[13px] flex items-start gap-3">
          <span>{contextBanner}</span>
          <Link
            href="/translate"
            className="ml-auto shrink-0 text-[11px] text-sky-300 hover:text-sky-100 underline underline-offset-2"
          >
            clear
          </Link>
        </div>
      )}

      <div className="mt-6 border-b border-rule flex items-center gap-5 text-sm">
        <button
          onClick={() => setTab("evaluate")}
          className={`pb-2 -mb-px border-b-2 ${
            tab === "evaluate"
              ? "border-sky-400 text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Evaluate one study
        </button>
        <button
          onClick={() => setTab("explore")}
          className={`pb-2 -mb-px border-b-2 ${
            tab === "explore"
              ? "border-sky-400 text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Explore &amp; rank set
        </button>
        <a
          href="#methodology"
          className="ml-auto text-[12px] text-slate-400 hover:text-slate-200"
        >
          Methodology ↓
        </a>
      </div>

      {tab === "evaluate" ? (
        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6">
          <ScoreForm features={features} setFeatures={setFeatures} />
          <div className="space-y-5">
            <ScoreResult result={result} />
            <SimilarCases query={featureMap} cases={trainingCases} />
          </div>
        </div>
      ) : (
        <ExploreTab onOpenCase={(c) => {
          setFeatures(featuresFromCase(c));
          setContextBanner(`Loaded from training case ${c.caseId}: ${c.name}`);
          setTab("evaluate");
        }} />
      )}

      <section
        id="methodology"
        className="mt-16 pt-8 border-t border-rule"
      >
        <h2 className="font-serif text-xl text-slate-100">Methodology</h2>
        <div className="mt-3 space-y-3 text-[13px] text-slate-300 max-w-3xl leading-relaxed">
          <p>
            <strong className="text-slate-100">What we predict:</strong> the
            likelihood that an animal biological phenomenon will translate to
            a human therapeutic, defined as an approved drug or sustained
            clinical use. The model is an L2-regularized logistic regression
            trained on 61 curated historical cases (16 translators, 45
            non-translators).
          </p>
          <p>
            <strong className="text-slate-100">How we know it works:</strong>{" "}
            leave-one-out cross-validation AUC of{" "}
            <span className="text-sky-300">0.975</span> on the original coding
            and <span className="text-sky-300">0.964</span> when a blinded
            independent coder re-scored features without seeing outcomes.
            Permutation test <em>p</em> &lt; 0.003.
          </p>
          <p>
            <strong className="text-slate-100">Human-cell evidence:</strong>{" "}
            when <code className="text-sky-300">human_cell_validation</code>{" "}
            and <code className="text-sky-300">assay_translatability</code>{" "}
            are provided, the full 13-feature model runs. When absent, a
            reduced 11-feature &quot;Pre-HC&quot; model automatically takes
            over — predicting the likelihood of advancing to human-cell
            testing rather than all the way to a drug. Missing features
            contribute zero to the logit, not an imputed mean.
          </p>
          <p>
            <strong className="text-slate-100">What it cannot predict:</strong>{" "}
            commercial viability, funding, regulatory shifts, or creative
            researchers overcoming structural barriers. Use the score as a
            prompt for discussion, not a decision.
          </p>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Feature weights (full model)
            </h3>
            <div className="bg-panel border border-rule rounded-md p-4">
              <FeatureImportanceChart />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 max-w-md">
              Forest plot of L2-regularized coefficients with 95% bootstrap
              CIs. Positive coefficients (blue) push translation probability
              up; negative (red) push down. Number on the right is sign
              consistency across bootstrap resamples — features below 0.85
              are greyed out and should be trusted only directionally.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              All 61 cases, scored
            </h3>
            <div className="bg-panel border border-rule rounded-md p-3">
              <CaseSpectrum cases={trainingCases} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 max-w-md">
              Each dot is a training case at its leave-one-out predicted
              probability. Hover for the case name. The dashed line is the
              0.5 decision threshold.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Canonical examples — true positives, true negatives, and one instructive miss
          </h3>
          <WorkedExamples />
          <p className="mt-3 text-[11px] text-slate-500 max-w-2xl">
            <span className="text-emerald-400">P03 Captopril</span> and{" "}
            <span className="text-emerald-400">P05 Caplacizumab</span> are
            true positives — the model scores both high.{" "}
            <span className="text-rose-400">N12 Antler regeneration</span> is
            a true negative — the model correctly scores low.{" "}
            <span className="text-amber-400">P26 Mambalgin</span> is an
            instructive miss: the features look translator-like but the
            compound has not yet advanced clinically — read the case in the
            Explore tab for why.
          </p>
        </div>
      </section>
    </main>
  );
}

// --- Explore tab (inline) ---

const MODALITIES: Modality[] = [
  "Secreted product",
  "Small molecule",
  "Cellular adaptation",
  "Organismal",
];

const MODALITY_COLOR: Record<Modality, string> = {
  "Secreted product":
    "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "Small molecule": "bg-sky-900/40 text-sky-300 border-sky-800",
  "Cellular adaptation":
    "bg-violet-900/40 text-violet-300 border-violet-800",
  Organismal: "bg-amber-900/40 text-amber-300 border-amber-800",
};

function ExploreTab({ onOpenCase }: { onOpenCase: (c: TrainingCase) => void }) {
  const [sortKey, setSortKey] = useState<"predicted" | "outcome" | "modality">(
    "predicted"
  );
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [outcome, setOutcome] = useState<"all" | "translated" | "failed">(
    "all"
  );
  const [mods, setMods] = useState<Set<Modality>>(new Set());
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TrainingCase | null>(null);

  const toggleMod = (m: Modality) => {
    const n = new Set(mods);
    if (n.has(m)) n.delete(m);
    else n.add(m);
    setMods(n);
  };

  const setSort = (k: "predicted" | "outcome" | "modality") => {
    if (k === sortKey) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setDir(k === "predicted" ? "desc" : "asc");
    }
  };

  const rows = useMemo(() => {
    let xs = trainingCases.slice();
    if (outcome === "translated") xs = xs.filter((c) => c.translated === 1);
    if (outcome === "failed") xs = xs.filter((c) => c.translated === 0);
    if (mods.size > 0) xs = xs.filter((c) => mods.has(modalityOf(c)));
    if (q.trim()) {
      const ql = q.toLowerCase();
      xs = xs.filter(
        (c) =>
          c.name.toLowerCase().includes(ql) ||
          c.description.toLowerCase().includes(ql) ||
          c.species.toLowerCase().includes(ql)
      );
    }
    xs.sort((a, b) => {
      let v = 0;
      if (sortKey === "predicted") v = a.looPredicted - b.looPredicted;
      else if (sortKey === "outcome") v = a.translated - b.translated;
      else v = modalityOf(a).localeCompare(modalityOf(b));
      return dir === "asc" ? v : -v;
    });
    return xs;
  }, [sortKey, dir, outcome, mods, q]);

  return (
    <div className="mt-6">
      <p className="text-[13px] text-slate-400 max-w-3xl mb-4">
        Browse all 61 training cases ranked by the leave-one-out predicted
        probability. Use this to find the most-likely translation candidates
        and to inspect the model&apos;s errors. Click any row to load its
        features into the Evaluate tab.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cases…"
          className="px-3 py-1.5 text-sm bg-panel border border-rule rounded-md w-56 text-slate-100 placeholder:text-slate-500"
        />
        <div className="flex rounded-md border border-rule overflow-hidden text-xs">
          {(["all", "translated", "failed"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setOutcome(v)}
              className={`px-3 py-1.5 ${
                outcome === v
                  ? "bg-slate-100 text-ink"
                  : "bg-panel text-slate-400 hover:text-slate-200"
              }`}
            >
              {v === "all"
                ? "All"
                : v === "translated"
                ? "Translated"
                : "Did not translate"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODALITIES.map((m) => {
            const on = mods.has(m);
            return (
              <button
                key={m}
                onClick={() => toggleMod(m)}
                className={`text-[11px] px-2 py-1 rounded-full border transition ${
                  on
                    ? MODALITY_COLOR[m]
                    : "text-slate-400 border-rule hover:border-slate-500"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-xs text-slate-500">
          {rows.length} / {trainingCases.length}
        </div>
      </div>

      <div className="mt-4 border border-rule rounded-lg bg-panel/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-panel text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5">Case</th>
              <th
                onClick={() => setSort("predicted")}
                className="text-left px-4 py-2.5 cursor-pointer"
              >
                Predicted{" "}
                {sortKey === "predicted"
                  ? dir === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </th>
              <th
                onClick={() => setSort("outcome")}
                className="text-left px-4 py-2.5 cursor-pointer"
              >
                Outcome{" "}
                {sortKey === "outcome"
                  ? dir === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </th>
              <th
                onClick={() => setSort("modality")}
                className="text-left px-4 py-2.5 cursor-pointer"
              >
                Modality{" "}
                {sortKey === "modality"
                  ? dir === "asc"
                    ? "↑"
                    : "↓"
                  : "↕"}
              </th>
              <th className="text-left px-4 py-2.5 w-10">✓</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const pct = Math.round(c.looPredicted * 100);
              const m = modalityOf(c);
              const kind = correctnessOf(c.looPredicted, c.translated);
              return (
                <tr
                  key={c.caseId}
                  onClick={() => setSelected(c)}
                  className="border-t border-rule/60 hover:bg-slate-800/30 cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-mono text-[11px] text-slate-500">
                      {c.caseId}
                    </div>
                    <div className="text-[13px] text-slate-200 leading-snug">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-500 italic">
                      {c.species}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-slate-200 w-8 text-right">
                        {pct}
                      </span>
                      <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <OutcomeBadge translated={c.translated} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${MODALITY_COLOR[m]}`}
                    >
                      {m}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <CorrectnessDot kind={kind} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CorrectnessDot kind="TP" /> correct positive
        </span>
        <span className="flex items-center gap-1">
          <CorrectnessDot kind="TN" /> correct negative
        </span>
        <span className="flex items-center gap-1">
          <CorrectnessDot kind="FP" /> false positive
        </span>
        <span className="flex items-center gap-1">
          <CorrectnessDot kind="FN" /> false negative
        </span>
      </div>

      {selected && (
        <CaseModal
          c={selected}
          onClose={() => setSelected(null)}
          onOpen={onOpenCase}
        />
      )}
    </div>
  );
}

function correctnessOf(pred: number, actual: 0 | 1): "TP" | "TN" | "FP" | "FN" {
  const pos = pred >= 0.5;
  if (pos && actual === 1) return "TP";
  if (!pos && actual === 0) return "TN";
  if (pos && actual === 0) return "FP";
  return "FN";
}

function CorrectnessDot({ kind }: { kind: "TP" | "TN" | "FP" | "FN" }) {
  const c =
    kind === "TP"
      ? "bg-emerald-500"
      : kind === "TN"
      ? "bg-pink-400"
      : kind === "FP"
      ? "bg-slate-400"
      : "bg-rose-500";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${c}`}
      title={kind}
    />
  );
}

function OutcomeBadge({ translated }: { translated: 0 | 1 }) {
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full border ${
        translated === 1
          ? "text-emerald-300 border-emerald-800 bg-emerald-900/30"
          : "text-rose-300 border-rose-800 bg-rose-900/30"
      }`}
    >
      {translated === 1 ? "Translated" : "Did not translate"}
    </span>
  );
}

function CaseModal({
  c,
  onClose,
  onOpen,
}: {
  c: TrainingCase;
  onClose: () => void;
  onOpen: (c: TrainingCase) => void;
}) {
  const r = score(c.features);
  const up = r.contributions.filter((x) => x.contribution > 0).slice(0, 3);
  const down = r.contributions.filter((x) => x.contribution < 0).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
      />
      <div className="relative z-10 bg-panel rounded-lg border border-rule shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto thin-scroll">
        <header className="sticky top-0 bg-panel border-b border-rule p-5 flex gap-4">
          <div className="min-w-0">
            <div className="text-xs font-mono text-slate-500">{c.caseId}</div>
            <h3 className="text-lg font-serif text-slate-100 leading-snug">
              {c.name}
            </h3>
            <div className="text-xs text-slate-500 italic">{c.species}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-100 text-2xl leading-none self-start"
          >
            ×
          </button>
        </header>
        <div className="p-5 space-y-4 text-[13px] text-slate-300">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Description
            </div>
            <p>{c.description}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              Outcome
            </div>
            <p>
              <OutcomeBadge translated={c.translated} /> — {c.outcome}
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
              References
            </div>
            <p className="text-xs text-slate-400">{c.refs}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-400 mb-1">
                Pushing up
              </div>
              <ul className="space-y-1 text-[12px]">
                {up.map((x) => (
                  <li
                    key={x.feature}
                    className="flex justify-between gap-2 font-mono"
                  >
                    <span className="text-slate-300 truncate">{x.feature}</span>
                    <span className="text-emerald-400">
                      +{x.contribution.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-rose-400 mb-1">
                Pushing down
              </div>
              <ul className="space-y-1 text-[12px]">
                {down.map((x) => (
                  <li
                    key={x.feature}
                    className="flex justify-between gap-2 font-mono"
                  >
                    <span className="text-slate-300 truncate">{x.feature}</span>
                    <span className="text-rose-400">
                      {x.contribution.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-between items-end gap-4 pt-3 border-t border-rule">
            <div className="flex gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500">Full model</div>
                <div className="font-mono tabular-nums text-slate-100">
                  {(r.probability * 100).toFixed(0)}/100
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">LOO pred</div>
                <div className="font-mono tabular-nums text-slate-100">
                  {(c.looPredicted * 100).toFixed(0)}/100
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onOpen(c);
                onClose();
              }}
              className="text-[12px] px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white"
            >
              Load into Evaluate →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep FeatureName import alive — referenced only transitively via model.ts imports.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _KeepType = FeatureName;
