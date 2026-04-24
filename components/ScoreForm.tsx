"use client";

import { trainingCases } from "@/lib/training";

export interface FeatureState {
  mechanism_clarity: number;
  ortholog_conservation: number;
  target_druggability: number;
  pathway_redundancy: number;
  effect_size_reported: number;
  is_secreted_product: 0 | 1;
  is_small_molecule_or_peptide: 0 | 1;
  requires_expression_system: 0 | 1;
  phenotype_is_organismal: 0 | 1;
  evidenceProvided: boolean;
  cross_species_consistency: number;
  human_cell_validation: number;
  assay_translatability: number;
  regulatory_precedent: number;
}

const sliderSpecs: Array<{
  key: keyof FeatureState;
  label: string;
  rubric: string;
}> = [
  {
    key: "mechanism_clarity",
    label: "Mechanism clarity",
    rubric:
      "9–10: rescue / direct causal experiment • 7: strong biochemical hypothesis • 5: phenomenological • 3: speculative • 0: none",
  },
  {
    key: "ortholog_conservation",
    label: "Ortholog conservation",
    rubric:
      "9–10: 1:1 ortholog >90% id • 7: conserved w/ minor diff • 5: unclear • 3: paralog issues • 0: no human counterpart",
  },
  {
    key: "target_druggability",
    label: "Target druggability",
    rubric:
      "9–10: enzyme/GPCR/channel/NR • 7: druggable w/ challenges • 5: PPI modulation • 3: hard target • 0: intractable",
  },
  {
    key: "pathway_redundancy",
    label: "Pathway non-redundancy",
    rubric:
      "Higher = less redundant. 9–10: unique bottleneck • 7: moderately unique • 5: parallel paths • 3: highly redundant • 0: full backup",
  },
  {
    key: "effect_size_reported",
    label: "Effect size reported",
    rubric:
      "9–10: near-complete phenotype • 7: large fold change • 5: moderate • 3: small/noisy • 0: qualitative only",
  },
];

const evidenceSliders: Array<{
  key: keyof FeatureState;
  label: string;
  rubric: string;
}> = [
  {
    key: "cross_species_consistency",
    label: "Cross-species consistency",
    rubric: "9–10 many species • 5 unknown • 0 contested",
  },
  {
    key: "human_cell_validation",
    label: "Human cell validation",
    rubric:
      "9–10 directly assayed, clear readout • 5 unknown • 0 never tested",
  },
  {
    key: "assay_translatability",
    label: "Assay translatability",
    rubric: "9–10 standard assay • 5 unknown • 0 no surrogate",
  },
  {
    key: "regulatory_precedent",
    label: "Regulatory precedent",
    rubric: "9–10 many approved • 5 unknown • 0 none",
  },
];

const binaries: Array<{ key: keyof FeatureState; q: string }> = [
  {
    key: "is_secreted_product",
    q: "Is the active agent a secreted molecule (venom, saliva, toxin, blood factor)?",
  },
  {
    key: "is_small_molecule_or_peptide",
    q: "Is the active agent a small molecule or peptide under ~5 kDa?",
  },
  {
    key: "requires_expression_system",
    q: "Does translating it require engineering human cells (transgene, gene edit)?",
  },
  {
    key: "phenotype_is_organismal",
    q: "Is the relevant phenotype whole-organism (lifespan, regen, behavior)?",
  },
];

const examples: Record<string, string> = {
  "Captopril (P03)": "P03",
  "Caplacizumab (P05)": "P05",
  "Antler regeneration (N12)": "N12",
  "Mambalgin (P26)": "P26",
};

interface Props {
  features: FeatureState;
  setFeatures: (s: FeatureState) => void;
}

export default function ScoreForm({ features, setFeatures }: Props) {
  const setSlider = (key: keyof FeatureState, v: number) =>
    setFeatures({ ...features, [key]: v });

  const setBinary = (key: keyof FeatureState, v: 0 | 1) =>
    setFeatures({ ...features, [key]: v });

  const reset = () =>
    setFeatures({
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
    });

  const loadExample = (caseId: string) => {
    const c = trainingCases.find((x) => x.caseId === caseId);
    if (!c) return;
    const f = c.features;
    setFeatures({
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
      phenotype_is_organismal:
        (f.phenotype_is_organismal as 0 | 1) ?? 0,
      evidenceProvided: true,
      cross_species_consistency: f.cross_species_consistency ?? 5,
      human_cell_validation: f.human_cell_validation ?? 5,
      assay_translatability: f.assay_translatability ?? 5,
      regulatory_precedent: f.regulatory_precedent ?? 5,
    });
  };

  return (
    <form className="space-y-7 bg-panel/60 border border-rule rounded-lg p-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-xs uppercase tracking-wider text-slate-500 mr-auto">
          Features
        </div>
        <label className="text-xs text-slate-600">
          Load example:
          <select
            className="ml-2 border border-rule rounded px-2 py-1 text-xs"
            defaultValue=""
            onChange={(e) => e.target.value && loadExample(e.target.value)}
          >
            <option value="">—</option>
            {Object.entries(examples).map(([label, id]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-slate-500 hover:text-slate-100 underline underline-offset-2"
        >
          reset
        </button>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          Modality
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {binaries.map(({ key, q }) => (
            <div
              key={key}
              className="border border-rule rounded-md p-3 flex items-start gap-3"
            >
              <p className="text-[13px] text-slate-300 flex-1 leading-snug">
                {q}
              </p>
              <YesNoToggle
                value={features[key] as 0 | 1}
                onChange={(v) => setBinary(key, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-100 mb-3">
          Mechanism and target
        </h3>
        <div className="space-y-4">
          {sliderSpecs.map(({ key, label, rubric }) => (
            <SliderRow
              key={key}
              label={label}
              rubric={rubric}
              value={features[key] as number}
              onChange={(v) => setSlider(key, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <label className="flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={features.evidenceProvided}
            onChange={(e) =>
              setFeatures({ ...features, evidenceProvided: e.target.checked })
            }
            className="mt-1 accent-sky-600"
          />
          <span>
            <span className="text-sm font-semibold text-slate-100">
              Evidence (optional — providing these enables Full-mode scoring)
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Adds 4 features and unlocks the full 13-feature model.
            </span>
          </span>
        </label>
        {features.evidenceProvided && (
          <div className="mt-4 space-y-4">
            {evidenceSliders.map(({ key, label, rubric }) => (
              <SliderRow
                key={key}
                label={label}
                rubric={rubric}
                value={features[key] as number}
                onChange={(v) => setSlider(key, v)}
              />
            ))}
          </div>
        )}
      </section>
    </form>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-md border border-rule overflow-hidden text-xs">
      {([
        [0, "No"],
        [1, "Yes"],
      ] as const).map(([v, label]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(v as 0 | 1)}
          className={`px-3 py-1.5 transition ${
            value === v
              ? "bg-slate-900 text-white"
              : "bg-panel/60 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  label,
  rubric,
  value,
  onChange,
}: {
  label: string;
  rubric: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-rubric relative">
      <div className="flex items-baseline justify-between">
        <div className="text-sm text-slate-100">
          {label}
          <span
            className="ml-1 text-slate-400 cursor-help"
            title={rubric}
          >
            ⓘ
          </span>
        </div>
        <div className="text-sm font-mono tabular-nums text-slate-300">
          {value}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-600"
      />
    </div>
  );
}
