"use client";

import { MODEL_FULL } from "@/lib/model";

// Fraction of bootstrap resamples where the coefficient kept its sign.
// Used only to dim features with low sign agreement (< 0.85) since their
// direction is uncertain even when the point estimate looks meaningful.
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

function fmtCoef(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

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
  // Round the axis bound up to a nice tick so the ticks land on readable numbers.
  const axisMax = roundUp(absMax);

  const width = 460;
  const rowH = 22;
  const padL = 150;
  const padR = 120; // room for the coefficient + CI label
  const innerW = width - padL - padR;
  const zero = padL + innerW / 2;
  const scale = innerW / 2 / axisMax;

  const topY = 10;
  const rowsH = features.length * rowH;
  const axisY = topY + rowsH + 6;
  const labelY = axisY + 14;
  const captionY = labelY + 14;

  // Axis ticks at ±axisMax and 0
  const ticks = [-axisMax, -axisMax / 2, 0, axisMax / 2, axisMax];

  return (
    <svg
      viewBox={`0 0 ${width} ${captionY + 4}`}
      className="w-full h-auto"
    >
      {/* zero line */}
      <line
        x1={zero}
        x2={zero}
        y1={topY}
        y2={topY + rowsH}
        stroke="#334155"
        strokeDasharray="2 3"
      />

      {features.map((f, i) => {
        const y = topY + 4 + i * rowH;
        const x0 = zero + f.lo * scale;
        const x1 = zero + f.hi * scale;
        const xp = zero + f.coef * scale;
        const positive = f.coef >= 0;
        const color = positive ? "#0284c7" : "#e11d48";
        const dim = f.sign < 0.85;
        return (
          <g key={f.name} opacity={dim ? 0.55 : 1}>
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
              opacity={0.55}
            />
            <circle cx={xp} cy={y} r={3.2} fill={color} />

            {/* Right side: coefficient and CI */}
            <text
              x={width - padR + 8}
              y={y + 4}
              className="fill-slate-200 font-mono"
              fontSize={9.5}
            >
              {fmtCoef(f.coef)}
            </text>
            <text
              x={width - padR + 8 + 36}
              y={y + 4}
              className="fill-slate-500 font-mono"
              fontSize={8.5}
            >
              [{f.lo.toFixed(2)}, {f.hi.toFixed(2)}]
            </text>
          </g>
        );
      })}

      {/* x-axis */}
      <line
        x1={padL}
        x2={padL + innerW}
        y1={axisY}
        y2={axisY}
        stroke="#475569"
        strokeWidth={0.8}
      />
      {ticks.map((t) => {
        const x = zero + t * scale;
        return (
          <g key={t}>
            <line
              x1={x}
              x2={x}
              y1={axisY - 2}
              y2={axisY + 3}
              stroke="#475569"
              strokeWidth={0.8}
            />
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              className="fill-slate-500 font-mono"
              fontSize={8.5}
            >
              {fmtCoef(t)}
            </text>
          </g>
        );
      })}

      <text
        x={zero}
        y={captionY}
        textAnchor="middle"
        className="fill-slate-500"
        fontSize={9.5}
      >
        Standardized L2 coefficient (log-odds per +1 SD of the feature)
      </text>
    </svg>
  );
}

/** Round n up to a "nice" number for axis bounds: 0.01, 0.02, 0.05, 0.1, 0.15, 0.2, … */
function roundUp(n: number): number {
  const steps = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 1];
  for (const s of steps) if (n <= s) return s;
  return Math.ceil(n);
}
