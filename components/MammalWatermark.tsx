"use client";

/**
 * A single minimalist white-line silhouette chosen from the species'
 * taxonomic ancestry. Rendered as a sparse watermark inside the
 * SpeciesDetail panel — subtle, not meant to be the focal point.
 *
 * Stroke uses currentColor so the caller controls color via CSS; no fill.
 */

interface Props {
  scientificName: string;
  commonName?: string;
  taxonomy?: string[]; // superorder → order → family → ...
  className?: string;
}

export default function MammalWatermark({
  scientificName,
  commonName = "",
  taxonomy = [],
  className = "",
}: Props) {
  const kind = classify(scientificName, commonName, taxonomy);
  const common = {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "bat") {
    return (
      <svg
        viewBox="0 0 260 140"
        aria-hidden="true"
        className={className}
        {...common}
      >
        <path d="M 10 80 Q 40 40 70 70 Q 90 55 100 80 Q 120 60 130 72 Q 140 60 160 80 Q 170 55 190 70 Q 220 40 250 80" />
        <path d="M 120 75 Q 130 90 140 75" />
        <path d="M 124 65 L 120 54 L 128 62 M 136 65 L 140 54 L 132 62" />
        <path d="M 125 92 L 122 100 M 135 92 L 138 100" />
      </svg>
    );
  }

  if (kind === "cetacean") {
    return (
      <svg
        viewBox="0 0 260 120"
        aria-hidden="true"
        className={className}
        {...common}
      >
        <path d="M 20 70 Q 70 40 140 45 Q 200 48 230 65 Q 245 70 250 80 L 240 80 Q 215 85 160 82 Q 110 88 60 78 Q 30 75 20 70 Z" />
        <path d="M 245 70 L 258 60 M 245 80 L 258 92" />
        <circle cx="45" cy="65" r="1.2" fill="currentColor" stroke="none" />
        <path d="M 120 45 Q 128 34 140 45" />
        <path d="M 85 80 Q 95 95 112 85" />
      </svg>
    );
  }

  if (kind === "elephant") {
    return (
      <svg
        viewBox="0 0 260 160"
        aria-hidden="true"
        className={className}
        {...common}
      >
        {/* body */}
        <path d="M 60 80 Q 70 55 110 52 Q 160 50 200 60 Q 225 65 235 80 Q 240 95 230 115" />
        <path d="M 70 115 Q 110 125 170 122 Q 205 122 230 115" />
        {/* head + trunk */}
        <path d="M 60 80 Q 45 82 40 70 Q 38 56 50 48 Q 65 44 80 56" />
        <path d="M 50 75 Q 44 92 40 110 Q 38 128 46 134 Q 54 132 54 120" />
        {/* ear */}
        <path d="M 58 52 Q 40 50 35 68 Q 38 82 55 82" />
        {/* tusk */}
        <path d="M 54 92 Q 50 100 46 106" />
        {/* legs */}
        <path d="M 90 120 L 88 150 M 120 120 L 120 150 M 180 120 L 180 150 M 215 118 L 218 150" />
        {/* tail */}
        <path d="M 235 100 Q 248 105 250 118 Q 246 124 242 120" />
      </svg>
    );
  }

  if (kind === "primate") {
    return (
      <svg
        viewBox="0 0 180 200"
        aria-hidden="true"
        className={className}
        {...common}
      >
        {/* head */}
        <ellipse cx="90" cy="40" rx="22" ry="26" />
        {/* face outline (inner) */}
        <path d="M 78 44 Q 90 56 102 44" />
        {/* body */}
        <path d="M 70 66 Q 62 100 72 140 Q 90 148 108 140 Q 118 100 110 66" />
        {/* arms */}
        <path d="M 68 74 Q 48 100 50 140 Q 52 150 60 154" />
        <path d="M 112 74 Q 132 100 130 140 Q 128 150 120 154" />
        {/* legs */}
        <path d="M 80 146 L 78 190 M 100 146 L 102 190" />
      </svg>
    );
  }

  // Default: stylized quadruped (rodents, carnivores, ungulates, etc.)
  return (
    <svg
      viewBox="0 0 260 140"
      aria-hidden="true"
      className={className}
      {...common}
    >
      <path d="M 40 60 Q 80 45 130 50 Q 180 52 215 60 Q 228 63 232 74" />
      <path d="M 60 90 Q 100 98 160 94 Q 190 92 215 95" />
      <path d="M 40 60 Q 28 52 28 42 Q 28 32 40 30 L 56 36 Q 58 44 54 56" />
      <path d="M 36 30 Q 32 20 38 24 M 48 28 Q 46 18 52 24" />
      <path d="M 64 92 L 60 128 M 82 92 L 85 128" />
      <path d="M 185 92 L 182 128 M 210 94 L 214 128" />
      <path d="M 232 74 Q 246 78 248 92 Q 244 100 238 96" />
      <circle cx="42" cy="42" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Shape = "bat" | "cetacean" | "elephant" | "primate" | "quadruped";

const CETACEAN_FAMILIES = new Set([
  "Balaenidae",
  "Balaenopteridae",
  "Delphinidae",
  "Physeteridae",
  "Ziphiidae",
  "Monodontidae",
  "Phocoenidae",
]);
const SIRENIAN_FAMILIES = new Set(["Trichechidae", "Dugongidae"]);

function classify(sci: string, common: string, taxonomy: string[]): Shape {
  const t = new Set(taxonomy);
  if (t.has("Chiroptera")) return "bat";
  if (t.has("Sirenia") || taxonomy.some((n) => SIRENIAN_FAMILIES.has(n)))
    return "cetacean";
  if (taxonomy.some((n) => CETACEAN_FAMILIES.has(n))) return "cetacean";
  if (t.has("Proboscidea")) return "elephant";
  if (t.has("Primates")) return "primate";
  return "quadruped";
}
