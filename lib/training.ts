import type { FeatureMap } from "./model";
import raw from "@/data/training_cases.json";

export interface TrainingCase {
  caseId: string;
  name: string;
  species: string;
  description: string;
  outcome: string;
  refs: string;
  translated: 0 | 1;
  translationStage: number;
  features: FeatureMap;
  looPredicted: number;
}

export const trainingCases = raw as TrainingCase[];

export type Modality =
  | "Secreted product"
  | "Small molecule"
  | "Cellular adaptation"
  | "Organismal";

export function modalityOf(c: TrainingCase): Modality {
  const f = c.features;
  if (f.is_secreted_product === 1) return "Secreted product";
  if (f.is_small_molecule_or_peptide === 1) return "Small molecule";
  if (f.phenotype_is_organismal === 1) return "Organismal";
  return "Cellular adaptation";
}

/**
 * Maps an Animal-Superpowers (scientificName, superpowerKey) pair to a
 * training case ID when the phenomenon/translation matches a row in the
 * training set. Used by the cross-page "Score for translation →" link.
 *
 * Verified matches (based on case names I've inspected in training_cases.json):
 * - Loxodonta/Elephas + cancer_resistance  → N30 (elephant LIF6 resurrection)
 * - Pteropus alecto + viral_tolerance      → N31 (bat constitutive IFN-α)
 * - Eptesicus fuscus + innate_immunity     → N32 (big brown bat TNFα c-Rel)
 * - Heterocephalus glaber + hypoxia_...    → N33 (NMR fructose switching)
 * - Rousettus aegyptiacus + viral_tolerance → reuse N31 as neighbor
 *
 * Not mapped → the Translate page opens with a context banner and defaults,
 * and the user fills in sliders themselves.
 */
export const speciesReviewToCase: Record<string, string> = {
  "Loxodonta africana::cancer_resistance": "N30",
  "Elephas maximus::cancer_resistance": "N30",
  "Pteropus alecto::viral_tolerance": "N31",
  "Rousettus aegyptiacus::viral_tolerance": "N31",
  "Eptesicus fuscus::innate_immunity": "N32",
  "Heterocephalus glaber::hypoxia_tolerance": "N33",
};
