/**
 * Thin client for the Translational Discovery API.
 *
 * API base is set by NEXT_PUBLIC_API_BASE (e.g. https://72.61.77.6/translate-api).
 * When it's unset OR the API is unreachable, all functions fall back to the
 * client-side model in lib/model.ts. The UI reflects which path was used via
 * ScoreSource.
 *
 * No API key is embedded in the browser. If TRANSLATION_API_KEY is set on the
 * server, these calls will 401 — in which case the frontend reverts to
 * client-side scoring automatically. For internal use cases that need the
 * paper-extraction endpoint, run a server-side Next.js route handler that
 * forwards with the key.
 */

import {
  score as clientScore,
  type FeatureMap,
  type ScoreResult,
} from "./model";

export const API_BASE: string = process.env.NEXT_PUBLIC_API_BASE || "";

export type ScoreSource = "api" | "client" | "client-fallback";

export interface ScoreOutcome {
  result: ScoreResult;
  source: ScoreSource;
  note?: string;
}

/**
 * Convert snake_case API response into the camelCase shape the frontend uses.
 */
function apiToScoreResult(raw: Record<string, unknown>): ScoreResult {
  const prob = Number(raw.probability ?? 0);
  const lo = Number(raw.probability_ci_lo ?? prob);
  const hi = Number(raw.probability_ci_hi ?? prob);
  const contribs = (raw.contributions as Array<Record<string, unknown>> | undefined) ?? [];
  return {
    probability: prob,
    probabilityCiLo: lo,
    probabilityCiHi: hi,
    uncertaintyWidth: hi - lo,
    tier: (raw.tier as ScoreResult["tier"]) ?? clientScore(features_safe()).tier,
    mode: (raw.mode as ScoreResult["mode"]) ?? "preHC",
    contributions: contribs.map((c) => ({
      feature: c.feature as ScoreResult["contributions"][number]["feature"],
      value: Number(c.value ?? 0),
      standardized: Number(c.standardized ?? 0),
      coefficient: Number(c.coefficient ?? 0),
      contribution: Number(c.contribution ?? 0),
    })),
    missingFeatures: (raw.missing_features as ScoreResult["missingFeatures"]) ?? [],
  };
}

function features_safe(): FeatureMap {
  return { mechanism_clarity: 5 };
}

export async function scoreFeatures(
  features: FeatureMap
): Promise<ScoreOutcome> {
  if (!API_BASE) {
    return { result: clientScore(features), source: "client" };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        result: clientScore(features),
        source: "client-fallback",
        note: `API ${res.status}${text ? ` — ${text.slice(0, 120)}` : ""}`,
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    return { result: apiToScoreResult(raw), source: "api" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      result: clientScore(features),
      source: "client-fallback",
      note: `API unreachable — ${msg.slice(0, 120)}`,
    };
  }
}

export interface PaperInput {
  title?: string;
  species?: string;
  text: string;
}

export interface EvaluateFromPaperResult {
  score: ScoreResult;
  extractedFeatures: FeatureMap;
  confidenceNote?: string;
  source: ScoreSource;
  note?: string;
}

/**
 * Extract features from paper text, then score. Requires API. If API is
 * unavailable, returns null so the caller can surface a hint to the user.
 */
export async function evaluatePaper(
  paper: PaperInput
): Promise<EvaluateFromPaperResult | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paper),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        score: clientScore({}),
        extractedFeatures: {},
        source: "client-fallback",
        note: `API ${res.status}${text ? ` — ${text.slice(0, 140)}` : ""}`,
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    const scoreRaw = raw.score as Record<string, unknown>;
    const extractionRaw = raw.extraction as Record<string, unknown>;
    const features = (extractionRaw?.features as FeatureMap) ?? {};
    return {
      score: apiToScoreResult(scoreRaw),
      extractedFeatures: features,
      confidenceNote: extractionRaw?.notes as string | undefined,
      source: "api",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      score: clientScore({}),
      extractedFeatures: {},
      source: "client-fallback",
      note: `API unreachable — ${msg.slice(0, 120)}`,
    };
  }
}

export interface EvaluatePdfOutcome {
  score: ScoreResult;
  extractedFeatures: FeatureMap;
  paperTitle?: string;
  sourceChars: number;
  confidenceNote?: string;
  source: ScoreSource;
  note?: string;
}

/**
 * Upload a PDF to the API. The server extracts text (pypdf), trims to
 * ~30k chars, feeds it to the Claude extractor, and returns the score +
 * features. No client-side fallback is meaningful here — without the API
 * we simply can't read the PDF.
 */
export async function evaluatePdf(
  file: File,
  opts: { title?: string; species?: string; apiKey?: string } = {}
): Promise<EvaluatePdfOutcome | null> {
  if (!API_BASE) return null;
  const form = new FormData();
  form.append("file", file);
  if (opts.title) form.append("title", opts.title);
  if (opts.species) form.append("species", opts.species);

  try {
    const headers: Record<string, string> = {};
    if (opts.apiKey) headers["X-API-Key"] = opts.apiKey;
    const res = await fetch(`${API_BASE}/evaluate/pdf`, {
      method: "POST",
      body: form,
      headers,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text;
      try {
        const j = JSON.parse(text);
        if (j?.detail) detail = j.detail;
      } catch {
        /* ignore */
      }
      return {
        score: clientScore({}),
        extractedFeatures: {},
        sourceChars: 0,
        source: "client-fallback",
        note: `API ${res.status} — ${detail.slice(0, 200)}`,
      };
    }
    const raw = (await res.json()) as Record<string, unknown>;
    const scoreRaw = raw.score as Record<string, unknown>;
    const extractionRaw = raw.extraction as Record<string, unknown>;
    const features = (extractionRaw?.features as FeatureMap) ?? {};
    return {
      score: apiToScoreResult(scoreRaw),
      extractedFeatures: features,
      paperTitle: raw.paper_title as string | undefined,
      sourceChars: Number(raw.source_chars ?? 0),
      confidenceNote: extractionRaw?.notes as string | undefined,
      source: "api",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      score: clientScore({}),
      extractedFeatures: {},
      sourceChars: 0,
      source: "client-fallback",
      note: `API unreachable — ${msg.slice(0, 200)}`,
    };
  }
}

export async function ping(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
