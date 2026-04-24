"use client";

import { MODEL_FULL } from "@/lib/model";

const signConsistency: Record<string, number> = {
  mechanism_clarity: 1.0,
  ortholog_conservation: 0.99,
  target_druggability: 1.0,
  pathway_redundancy: 1.0,
  is_secreted_product: 0.82,
  is_small_molecule_or_peptide: 0.99,
  requires_expression_system: 1.0,
  cross_species_consistency: 1.0,
  human_cell_validation: 1.0,
  effect_size_reported: 1.0,
  assay_translatability: 1.0,
  phenotype_is_organismal: 1.0,
  regulatory_precedent: 0.68,
};

export default function FeatureImportanceChart() {
  const features = MODEL_FULL.features
    .map((f) => ({
      name: f,
      coef: MODEL_FULL.coefficients[f],
      lo: MODEL_FULL.coefficientsCiLo[f],
      hi: MODEL_FULL.coefficientsCiHi[f],
      sign: signConsistency[f] ?? 1,
    }))
    .sort((a, b) => Math.abs(b.coef) - Math.abs(a.coef));

  const absMax = Math.max(
    ...features.flatMap((f) => [Math.abs(f.lo), Math.abs(f.hi)])
  );
  const width = 360;
  const rowH = 22;
  const padL = 150;
  const padR = 45;
  const innerW = width - padL - padR;
  const zero = padL + innerW / 2;
  const scale = innerW / 2 / absMax;

  return (
    <svg
      viewBox={`0 0 ${width} ${features.length * rowH + 30}`}
      className="w-full h-auto"
    >
      {/* zero line */}
      <line
        x1={zero}
        x2={zero}
        y1={10}
        y2={features.length * rowH + 10}
        stroke="#334155"
        strokeDasharray="2 3"
      />
      {features.map((f, i) => {
        const y = 14 + i * rowH;
        const x0 = zero + f.lo * scale;
        const x1 = zero + f.hi * scale;
        const xp = zero + f.coef * scale;
        const positive = f.coef >= 0;
        const color = positive ? "#0284c7" : "#e11d48";
        const dim = f.sign < 0.85;
        return (
          <g key={f.name} opacity={dim ? 0.5 : 1}>
            <text
              x={padL - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-slate-300"
              fontSize={10}
            >
              {f.name}
            </text>
            <line
              x1={x0}
              x2={x1}
              y1={y}
              y2={y}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.5}
            />
            <circle cx={xp} cy={y} r={3.2} fill={color} />
            <text
              x={width - padR + 6}
              y={y + 4}
              className={dim ? "fill-slate-400" : "fill-slate-400"}
              fontSize={9.5}
            >
              {f.sign.toFixed(2)}
            </text>
          </g>
        );
      })}
      <text
        x={zero}
        y={features.length * rowH + 26}
        textAnchor="middle"
        className="fill-slate-400"
        fontSize={10}
      >
        Standardized L2 coefficient (negative ← 0 → positive)
      </text>
    </svg>
  );
}
