"use client";

import { useState } from "react";

export interface PaperMeta {
  title: string;
  doi: string;
  species: string;
  abstract: string;
}

interface Props {
  paper: PaperMeta;
  setPaper: (p: PaperMeta) => void;
  apiAvailable: boolean;
  extracting: boolean;
  onExtract: () => void;
  hint?: string | null;
}

export default function PaperInputPanel({
  paper,
  setPaper,
  apiAvailable,
  extracting,
  onExtract,
  hint,
}: Props) {
  const [showAbstract, setShowAbstract] = useState<boolean>(!!paper.abstract);

  return (
    <div className="bg-panel/60 border border-rule rounded-lg p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Paper being evaluated
          </div>
          <p className="mt-1 text-[12px] text-slate-500 max-w-lg">
            Give the model something to anchor to: a title, a DOI, and (if you
            want auto-feature extraction) the abstract.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <input
          value={paper.title}
          onChange={(e) => setPaper({ ...paper, title: e.target.value })}
          placeholder="Paper title — e.g. 'Cold-inducible RNA-binding protein drives enhanced DNA repair in bowhead whale'"
          className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={paper.doi}
            onChange={(e) => setPaper({ ...paper, doi: e.target.value })}
            placeholder="DOI (optional) — 10.1038/s41586-025-09694-5"
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
          />
          <input
            value={paper.species}
            onChange={(e) => setPaper({ ...paper, species: e.target.value })}
            placeholder="Source species (optional) — e.g. Balaena mysticetus"
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {showAbstract ? (
          <textarea
            value={paper.abstract}
            onChange={(e) => setPaper({ ...paper, abstract: e.target.value })}
            placeholder="Abstract or mechanism description. Paste a few sentences — the model uses this to auto-extract the 13 features."
            rows={5}
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500 leading-relaxed"
          />
        ) : (
          <button
            onClick={() => setShowAbstract(true)}
            type="button"
            className="self-start text-[12px] text-sky-400 hover:text-sky-200"
          >
            + add abstract for auto-extraction
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={!apiAvailable || extracting || paper.abstract.trim().length < 20}
          onClick={onExtract}
          className={`text-[12px] px-3 py-2 rounded-md ${
            !apiAvailable || extracting || paper.abstract.trim().length < 20
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-sky-600 text-white hover:bg-sky-500"
          }`}
          title={
            !apiAvailable
              ? "API not configured — paste features manually below, or set NEXT_PUBLIC_API_BASE"
              : paper.abstract.trim().length < 20
              ? "Paste at least a short abstract (20+ chars)"
              : "Extract 13 features from the abstract and score"
          }
        >
          {extracting ? "Extracting…" : "Extract features from abstract & score →"}
        </button>
        <span className="text-[11px] text-slate-500">
          {apiAvailable ? (
            <span className="text-emerald-400">API ready</span>
          ) : (
            <span className="text-slate-500">
              API not configured — fill sliders manually below
            </span>
          )}
        </span>
        {hint && (
          <span className="text-[11px] text-amber-300">{hint}</span>
        )}
      </div>
    </div>
  );
}
