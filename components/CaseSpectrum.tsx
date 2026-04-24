"use client";

import { useMemo, useState } from "react";
import type { TrainingCase } from "@/lib/training";

function seededJitter(caseId: string): number {
  let h = 0;
  for (let i = 0; i < caseId.length; i++) h = (h * 31 + caseId.charCodeAt(i)) | 0;
  // map [-0.5, 0.5]
  return ((h % 1000) / 1000) - 0.5;
}

export default function CaseSpectrum({ cases }: { cases: TrainingCase[] }) {
  const [hover, setHover] = useState<TrainingCase | null>(null);
  const dots = useMemo(
    () =>
      cases.map((c) => ({
        c,
        x: c.looPredicted,
        j: seededJitter(c.caseId),
      })),
    [cases]
  );

  const w = 460;
  const h = 140;
  const padL = 10;
  const padR = 10;
  const innerW = w - padL - padR;
  const midY = h / 2;
  const jitterAmp = 38;

  return (
    <div className="relative border border-rule/60 rounded-md bg-slate-900/40 p-2">
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="w-full h-auto">
        <rect x={0} y={0} width={w} height={h} fill="#0b1220" />
        {/* 0.5 dashed line */}
        <line
          x1={padL + innerW * 0.5}
          x2={padL + innerW * 0.5}
          y1={4}
          y2={h - 4}
          stroke="#475569"
          strokeDasharray="3 3"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <text
              x={padL + innerW * t}
              y={h + 12}
              textAnchor="middle"
              fontSize={9.5}
              className="fill-slate-400"
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {dots.map(({ c, x, j }) => {
          const cx = padL + innerW * x;
          const cy = midY + j * jitterAmp;
          const fill = c.translated === 1 ? "#0284c7" : "#e11d48";
          return (
            <circle
              key={c.caseId}
              cx={cx}
              cy={cy}
              r={hover?.caseId === c.caseId ? 5 : 3.5}
              fill={fill}
              fillOpacity={0.75}
              stroke="#fff"
              strokeWidth={0.8}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-600" />
          Translated
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
          Did not translate
        </span>
        <span className="ml-auto text-slate-500">dashed line = 0.5 threshold</span>
      </div>

      {hover && (
        <div className="absolute top-2 right-2 bg-slate-900 border border-rule shadow-md rounded px-2 py-1.5 text-[11px] max-w-[260px]">
          <div className="font-mono text-slate-500">{hover.caseId}</div>
          <div className="text-slate-800 leading-snug">{hover.name}</div>
          <div className="mt-1 text-slate-600">
            pred{" "}
            <span className="font-mono">{hover.looPredicted.toFixed(2)}</span>
            {" · "}
            <span
              className={
                hover.translated ? "text-emerald-700" : "text-rose-700"
              }
            >
              {hover.translated ? "translated" : "did not translate"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
