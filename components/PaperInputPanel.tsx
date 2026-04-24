"use client";

import { useRef, useState } from "react";

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
  onExtractFromAbstract: () => void;
  onExtractFromPdf: (file: File) => void;
  hint?: string | null;
}

export default function PaperInputPanel({
  paper,
  setPaper,
  apiAvailable,
  extracting,
  onExtractFromAbstract,
  onExtractFromPdf,
  hint,
}: Props) {
  const [mode, setMode] = useState<"pdf" | "abstract">("pdf");
  const [dragOver, setDragOver] = useState(false);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.type && !/pdf/i.test(file.type)) {
      alert(`Expected a PDF (got ${file.type}).`);
      return;
    }
    setPdfName(file.name);
    onExtractFromPdf(file);
  };

  return (
    <div className="bg-panel/60 border border-rule rounded-lg p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Paper being evaluated
          </div>
          <p className="mt-1 text-[12px] text-slate-500 max-w-lg">
            Upload the PDF and the model reads the whole paper, extracts the
            13 features automatically, and scores it. No PDF handy? Paste the
            abstract.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <input
          value={paper.title}
          onChange={(e) => setPaper({ ...paper, title: e.target.value })}
          placeholder="Paper title (optional — we'll guess from the PDF if blank)"
          className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={paper.doi}
            onChange={(e) => setPaper({ ...paper, doi: e.target.value })}
            placeholder="DOI (optional) — 10.1038/…"
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
          />
          <input
            value={paper.species}
            onChange={(e) => setPaper({ ...paper, species: e.target.value })}
            placeholder="Source species (optional)"
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[12px]">
        <button
          type="button"
          onClick={() => setMode("pdf")}
          className={`pb-1.5 border-b-2 ${
            mode === "pdf"
              ? "border-sky-400 text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Upload full PDF
        </button>
        <button
          type="button"
          onClick={() => setMode("abstract")}
          className={`pb-1.5 border-b-2 ${
            mode === "abstract"
              ? "border-sky-400 text-slate-100"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Paste abstract
        </button>
      </div>

      {mode === "pdf" ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0] ?? null;
            handleFile(f);
          }}
          className={`mt-3 rounded-md border border-dashed p-6 text-center transition ${
            dragOver
              ? "border-sky-400 bg-sky-950/30"
              : "border-rule bg-ink/40"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-[13px] text-slate-300">
            {extracting
              ? `Reading ${pdfName ?? "PDF"} and running the rubric…`
              : pdfName
              ? `Loaded: ${pdfName}`
              : "Drop a PDF here, or"}
          </div>
          <button
            type="button"
            disabled={!apiAvailable || extracting}
            onClick={() => fileRef.current?.click()}
            className={`mt-2 text-[12px] px-3 py-1.5 rounded-md ${
              !apiAvailable || extracting
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-sky-600 text-white hover:bg-sky-500"
            }`}
          >
            {pdfName ? "Choose a different PDF" : "Choose a PDF"}
          </button>
          <div className="mt-3 text-[11px] text-slate-500">
            {apiAvailable
              ? "Extraction runs server-side via Claude with the same blind-coding rubric used for validation."
              : "API not reachable — full-paper extraction needs the backend. Paste the abstract instead."}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <textarea
            value={paper.abstract}
            onChange={(e) => setPaper({ ...paper, abstract: e.target.value })}
            placeholder="Paste the abstract (or a longer description — the model will handle up to ~30k chars)."
            rows={6}
            className="w-full px-3 py-2 text-sm bg-ink border border-rule rounded-md text-slate-100 placeholder:text-slate-500 leading-relaxed"
          />
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              disabled={
                !apiAvailable || extracting || paper.abstract.trim().length < 20
              }
              onClick={onExtractFromAbstract}
              className={`text-[12px] px-3 py-2 rounded-md ${
                !apiAvailable ||
                extracting ||
                paper.abstract.trim().length < 20
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-sky-600 text-white hover:bg-sky-500"
              }`}
            >
              {extracting ? "Extracting…" : "Extract features & score →"}
            </button>
            <span className="text-[11px] text-slate-500">
              {apiAvailable
                ? "Needs at least a few sentences."
                : "API not reachable — fill the sliders manually."}
            </span>
          </div>
        </div>
      )}

      {hint && (
        <div className="mt-3 text-[11.5px] text-amber-300">{hint}</div>
      )}
    </div>
  );
}
