// lib/model.ts
// Auto-generated. L2 logistic regression, n=61 curated cases, C=0.010.
// Full model LOO-CV AUC = 0.975; Pre-HC model LOO-CV AUC = 0.968.
// Blind-coded validation AUC = 0.964 (only 0.011 drop, signal robust).

export type FeatureName =
  | 'mechanism_clarity'
  | 'ortholog_conservation'
  | 'target_druggability'
  | 'pathway_redundancy'
  | 'is_secreted_product'
  | 'is_small_molecule_or_peptide'
  | 'requires_expression_system'
  | 'cross_species_consistency'
  | 'human_cell_validation'
  | 'effect_size_reported'
  | 'assay_translatability'
  | 'phenotype_is_organismal'
  | 'regulatory_precedent';

export type FeatureMap = Partial<Record<FeatureName, number>>;

export interface ModelSpec {
  intercept: number;
  interceptCiLo: number;
  interceptCiHi: number;
  coefficients: Record<string, number>;
  coefficientsCiLo: Record<string, number>;
  coefficientsCiHi: Record<string, number>;
  standardization: Record<string, { mean: number; std: number }>;
  features: FeatureName[];
}

export const MODEL_FULL: ModelSpec = {
  "intercept": -0.1269892567687104,
  "interceptCiLo": -0.16937048107515995,
  "interceptCiHi": -0.08214160156055887,
  "coefficients": {
    "mechanism_clarity": 0.07779390791797663,
    "ortholog_conservation": 0.05744697088531668,
    "target_druggability": 0.08315591008375359,
    "pathway_redundancy": 0.0772603625680597,
    "is_secreted_product": 0.023471033696414165,
    "is_small_molecule_or_peptide": 0.05653729967155879,
    "requires_expression_system": -0.06792070897935282,
    "cross_species_consistency": 0.09737060068515639,
    "human_cell_validation": 0.08949061854400608,
    "effect_size_reported": 0.11326841828414645,
    "assay_translatability": 0.09498410445556127,
    "phenotype_is_organismal": -0.07882662265109353,
    "regulatory_precedent": 0.010578352194591316
  },
  "coefficientsCiLo": {
    "mechanism_clarity": 0.040974186153419245,
    "ortholog_conservation": 0.012960317101542478,
    "target_druggability": 0.04408265864074148,
    "pathway_redundancy": 0.03690802783914848,
    "is_secreted_product": -0.0255463809711903,
    "is_small_molecule_or_peptide": 0.007789128628274825,
    "requires_expression_system": -0.10279921396023123,
    "cross_species_consistency": 0.06628785945093243,
    "human_cell_validation": 0.05994074190050095,
    "effect_size_reported": 0.07778116025031671,
    "assay_translatability": 0.06313124534926548,
    "phenotype_is_organismal": -0.11895838650736845,
    "regulatory_precedent": -0.038887923357733556
  },
  "coefficientsCiHi": {
    "mechanism_clarity": 0.11094741363967567,
    "ortholog_conservation": 0.10025311391655299,
    "target_druggability": 0.11952975283826112,
    "pathway_redundancy": 0.10982426948236795,
    "is_secreted_product": 0.06814955218548209,
    "is_small_molecule_or_peptide": 0.0997812923439866,
    "requires_expression_system": -0.02646414367950238,
    "cross_species_consistency": 0.1224035669328201,
    "human_cell_validation": 0.11468448243602412,
    "effect_size_reported": 0.14318958560310832,
    "assay_translatability": 0.12146307890265401,
    "phenotype_is_organismal": -0.03929758750725158,
    "regulatory_precedent": 0.05370965503193406
  },
  "standardization": {
    "mechanism_clarity": {
      "mean": 7.672131147540983,
      "std": 1.8705772886027425
    },
    "ortholog_conservation": {
      "mean": 6.704918032786885,
      "std": 2.264076276701825
    },
    "target_druggability": {
      "mean": 6.311475409836065,
      "std": 2.4664368911285597
    },
    "pathway_redundancy": {
      "mean": 5.180327868852459,
      "std": 1.722638052440248
    },
    "is_secreted_product": {
      "mean": 0.36065573770491804,
      "std": 0.4801907710123544
    },
    "is_small_molecule_or_peptide": {
      "mean": 0.4098360655737705,
      "std": 0.49180327868852464
    },
    "requires_expression_system": {
      "mean": 0.4918032786885246,
      "std": 0.49993280924514444
    },
    "cross_species_consistency": {
      "mean": 6.786885245901639,
      "std": 2.158587532247067
    },
    "human_cell_validation": {
      "mean": 6.377049180327869,
      "std": 2.8351652129049802
    },
    "effect_size_reported": {
      "mean": 7.163934426229508,
      "std": 1.680947506702766
    },
    "assay_translatability": {
      "mean": 6.295081967213115,
      "std": 2.5883994820211345
    },
    "phenotype_is_organismal": {
      "mean": 0.5245901639344263,
      "std": 0.4993949577615677
    },
    "regulatory_precedent": {
      "mean": 5.098360655737705,
      "std": 2.2594422497075475
    }
  },
  "features": [
    "mechanism_clarity",
    "ortholog_conservation",
    "target_druggability",
    "pathway_redundancy",
    "is_secreted_product",
    "is_small_molecule_or_peptide",
    "requires_expression_system",
    "cross_species_consistency",
    "human_cell_validation",
    "effect_size_reported",
    "assay_translatability",
    "phenotype_is_organismal",
    "regulatory_precedent"
  ]
};

export const MODEL_PRE_HC: ModelSpec = {
  "intercept": -0.1267101753241659,
  "interceptCiLo": -0.1681340632617291,
  "interceptCiHi": -0.07974356902936022,
  "coefficients": {
    "mechanism_clarity": 0.08759619416669691,
    "ortholog_conservation": 0.06395077277014292,
    "target_druggability": 0.09186746877058088,
    "pathway_redundancy": 0.08944319190769921,
    "is_secreted_product": 0.029154788075478572,
    "is_small_molecule_or_peptide": 0.06478542932069012,
    "requires_expression_system": -0.07842274207260201,
    "cross_species_consistency": 0.10872331871194559,
    "effect_size_reported": 0.12040992469610087,
    "phenotype_is_organismal": -0.08919652936588827,
    "regulatory_precedent": 0.014894388352933297
  },
  "coefficientsCiLo": {
    "mechanism_clarity": 0.05329257424602964,
    "ortholog_conservation": 0.02271594181126753,
    "target_druggability": 0.05474020367404058,
    "pathway_redundancy": 0.04831847627475354,
    "is_secreted_product": -0.023713918750507386,
    "is_small_molecule_or_peptide": 0.01717920257623936,
    "requires_expression_system": -0.11709784959624607,
    "cross_species_consistency": 0.07580859225162138,
    "effect_size_reported": 0.08362810714981252,
    "phenotype_is_organismal": -0.1298057829481888,
    "regulatory_precedent": -0.0318469194654503
  },
  "coefficientsCiHi": {
    "mechanism_clarity": 0.1227957317413071,
    "ortholog_conservation": 0.10586482145639158,
    "target_druggability": 0.12567922162738657,
    "pathway_redundancy": 0.12343817912926143,
    "is_secreted_product": 0.08113479734763426,
    "is_small_molecule_or_peptide": 0.11186937926335737,
    "requires_expression_system": -0.03764098733735773,
    "cross_species_consistency": 0.13901360264652804,
    "effect_size_reported": 0.15549261984218551,
    "phenotype_is_organismal": -0.0467009554533701,
    "regulatory_precedent": 0.06418072336966271
  },
  "standardization": {
    "mechanism_clarity": {
      "mean": 7.672131147540983,
      "std": 1.8705772886027425
    },
    "ortholog_conservation": {
      "mean": 6.704918032786885,
      "std": 2.264076276701825
    },
    "target_druggability": {
      "mean": 6.311475409836065,
      "std": 2.4664368911285597
    },
    "pathway_redundancy": {
      "mean": 5.180327868852459,
      "std": 1.722638052440248
    },
    "is_secreted_product": {
      "mean": 0.36065573770491804,
      "std": 0.4801907710123544
    },
    "is_small_molecule_or_peptide": {
      "mean": 0.4098360655737705,
      "std": 0.49180327868852464
    },
    "requires_expression_system": {
      "mean": 0.4918032786885246,
      "std": 0.49993280924514444
    },
    "cross_species_consistency": {
      "mean": 6.786885245901639,
      "std": 2.158587532247067
    },
    "effect_size_reported": {
      "mean": 7.163934426229508,
      "std": 1.680947506702766
    },
    "phenotype_is_organismal": {
      "mean": 0.5245901639344263,
      "std": 0.4993949577615677
    },
    "regulatory_precedent": {
      "mean": 5.098360655737705,
      "std": 2.2594422497075475
    }
  },
  "features": [
    "mechanism_clarity",
    "ortholog_conservation",
    "target_druggability",
    "pathway_redundancy",
    "is_secreted_product",
    "is_small_molecule_or_peptide",
    "requires_expression_system",
    "cross_species_consistency",
    "effect_size_reported",
    "phenotype_is_organismal",
    "regulatory_precedent"
  ]
};

export const MODE_FULL_REQUIRED_FEATURES: FeatureName[] =
  ['human_cell_validation', 'assay_translatability'];

export interface Contribution {
  feature: FeatureName;
  value: number;
  standardized: number;
  coefficient: number;
  contribution: number;
}

export interface ScoreResult {
  probability: number;
  probabilityCiLo: number;
  probabilityCiHi: number;
  uncertaintyWidth: number;       // probabilityCiHi - probabilityCiLo
  tier: 'High' | 'Medium' | 'Low' | 'Not Recommended';
  mode: 'full' | 'preHC';
  contributions: Contribution[];
  missingFeatures: FeatureName[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function tierFromProbability(p: number): ScoreResult['tier'] {
  if (p >= 0.75) return 'High';
  if (p >= 0.55) return 'Medium';
  if (p >= 0.30) return 'Low';
  return 'Not Recommended';
}

/**
 * Compute a translation-likelihood score with bootstrap-derived CI.
 *
 * Mode selection is automatic: if both human_cell_validation and
 * assay_translatability are provided, the full (13-feature) model runs;
 * otherwise the pre-HC (11-feature) model runs.
 *
 * Missing features contribute 0 to the logit (they are ignored, not imputed).
 * The uncertainty band reflects the bootstrap CI of the coefficients of the
 * features that WERE provided.
 */
export function score(features: FeatureMap): ScoreResult {
  const hasRequiredForFull = MODE_FULL_REQUIRED_FEATURES.every(
    f => features[f] !== undefined
  );
  const model = hasRequiredForFull ? MODEL_FULL : MODEL_PRE_HC;
  const mode: 'full' | 'preHC' = hasRequiredForFull ? 'full' : 'preHC';

  let logit = model.intercept;
  let logitLo = model.interceptCiLo;
  let logitHi = model.interceptCiHi;

  const contributions: Contribution[] = [];
  const missingFeatures: FeatureName[] = [];

  for (const f of model.features) {
    const value = features[f];
    if (value === undefined) {
      missingFeatures.push(f);
      continue;
    }
    const coef = model.coefficients[f];
    const coefLo = model.coefficientsCiLo[f];
    const coefHi = model.coefficientsCiHi[f];
    const { mean, std } = model.standardization[f];
    const z = (value - mean) / std;

    const contribution = coef * z;
    logit += contribution;

    // Depending on sign of z, the lower CI coefficient may push logit up or down
    if (z >= 0) {
      logitLo += coefLo * z;
      logitHi += coefHi * z;
    } else {
      logitLo += coefHi * z;
      logitHi += coefLo * z;
    }

    contributions.push({ feature: f, value, standardized: z, coefficient: coef, contribution });
  }

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  const probability = sigmoid(logit);
  const probabilityCiLo = sigmoid(logitLo);
  const probabilityCiHi = sigmoid(logitHi);

  return {
    probability,
    probabilityCiLo,
    probabilityCiHi,
    uncertaintyWidth: probabilityCiHi - probabilityCiLo,
    tier: tierFromProbability(probability),
    mode,
    contributions,
    missingFeatures,
  };
}

/**
 * Simple Euclidean nearest-neighbor search in standardized feature space.
 * Used to show "similar cases" alongside a prediction.
 */
export function findSimilar<T extends { features: FeatureMap }>(
  query: FeatureMap,
  dataset: T[],
  k = 3
): T[] {
  const activeFeatures = Object.keys(query).filter(
    f => query[f as FeatureName] !== undefined
  ) as FeatureName[];

  if (activeFeatures.length === 0) return dataset.slice(0, k);

  const model = MODEL_FULL;
  const qVec = activeFeatures.map(f => {
    const s = model.standardization[f];
    return ((query[f] as number) - s.mean) / s.std;
  });

  return dataset
    .map(c => {
      const cVec = activeFeatures.map(f => {
        const v = c.features[f];
        if (v === undefined) return 0;
        const s = model.standardization[f];
        return (v - s.mean) / s.std;
      });
      let dist = 0;
      for (let i = 0; i < qVec.length; i++) {
        const d = qVec[i] - cVec[i];
        dist += d * d;
      }
      return { case: c, dist: Math.sqrt(dist) };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k)
    .map(x => x.case);
}
