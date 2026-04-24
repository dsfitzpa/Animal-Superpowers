"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { SpeciesDataset, Citation } from "@/lib/types";

interface Props {
  dataset: SpeciesDataset;
  speciesName: string | null;
  onClose: () => void;
}

function CitationLink({ c }: { c: Citation }) {
  const href = c.url
    ? c.url
    : c.doi
    ? `https://doi.org/${c.doi}`
    : c.pmid
    ? `https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`
    : null;
  const inner = (
    <>
      <span className="text-slate-300">{c.label}</span>
      {c.doi && (
        <span className="text-slate-500 ml-1">— doi:{c.doi}</span>
      )}
      {c.pmid && (
        <span className="text-slate-500 ml-1">— PMID:{c.pmid}</span>
      )}
    </>
  );
  if (!href) return <span className="text-[12px]">{inner}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[12px] hover:text-blue-300"
    >
      {inner}
    </a>
  );
}

export default function SpeciesDetail({ dataset, speciesName, onClose }: Props) {
  useEffect(() => {
    if (!speciesName) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [speciesName, onClose]);

  if (!speciesName) return null;
  const rec = dataset.species_data[speciesName];
  if (!rec) return null;

  const reviewEntries = Object.entries(rec.reviews);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl bg-panel border-l border-rule shadow-2xl flex flex-col h-full overflow-hidden"
      >
        <header className="p-5 border-b border-rule flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Species profile
            </div>
            <h2 className="text-xl font-serif mt-1 text-slate-100 leading-tight">
              {rec.common}
            </h2>
            <p className="text-[13px] italic text-slate-400 mt-0.5">
              {speciesName}
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-slate-500">
              {typeof rec.lifespan_years === "number" && (
                <span>
                  Max lifespan:{" "}
                  <span className="text-slate-300">{rec.lifespan_years} yr</span>
                </span>
              )}
              {typeof rec.body_mass_g === "number" && (
                <span>
                  Body mass:{" "}
                  <span className="text-slate-300">
                    {formatMass(rec.body_mass_g)}
                  </span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="text-slate-400 hover:text-slate-100 text-xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto thin-scroll">
          <section className="p-5 border-b border-rule">
            <p className="text-[14px] text-slate-200 leading-relaxed">
              {rec.headline}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rec.superpowers.map((p) => {
                const meta = dataset.superpowers[p];
                if (!meta) return null;
                return (
                  <span
                    key={p}
                    className="text-[11px] px-2 py-0.5 rounded-full border"
                    style={{ color: meta.color, borderColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </section>

          {reviewEntries.length === 0 && (
            <section className="p-5 text-[13px] text-slate-500">
              This species is on the tree as a phylogenetic reference. No curated
              therapeutic review is available yet.
            </section>
          )}

          {reviewEntries.map(([key, review]) => {
            const meta = dataset.superpowers[key];
            return (
              <section key={key} className="p-5 border-b border-rule last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: meta?.color }}
                  />
                  <h3 className="text-[12px] uppercase tracking-[0.16em] text-slate-300">
                    {meta?.label ?? key}
                  </h3>
                </div>
                <div className="prose-invert-compact text-[13px]">
                  <ReactMarkdown>{review.summary}</ReactMarkdown>
                </div>

                {review.human_targets.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                      Potential human targets
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {review.human_targets.map((t) => (
                        <li
                          key={t}
                          className="text-[11.5px] bg-slate-800/70 border border-slate-700 px-2 py-0.5 rounded text-slate-200"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.citations.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                      References
                    </div>
                    <ul className="space-y-1">
                      {review.citations.map((c, i) => (
                        <li key={i}>
                          <CitationLink c={c} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function formatMass(g: number): string {
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(1)} t`;
  if (g >= 1000) return `${(g / 1000).toFixed(1)} kg`;
  return `${g} g`;
}
