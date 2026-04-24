# Animal Superpowers

Two companion tools in one Next.js app:

1. **`/`** — an interactive radial phylogeny of ~40 curated mammals that have evolved extreme biological adaptations (longevity, cancer resistance, viral tolerance, DNA repair, hibernation, tissue regeneration), each annotated with primary literature and candidate human therapeutic targets. Inspired by the [Zoonomia Project mammal tree](https://zoonomiaproject.org/the-mammal-tree-view/).
2. **`/translate`** — *Translational Discovery*. A logistic-regression model that scores how likely a given animal biological phenomenon is to translate into an approved human therapeutic, trained on 61 curated historical cases. Reached from the header nav, and from every citation in the species detail panel via the **Score for translation →** link, which pre-fills the form with context from the referenced paper.

**Live:** https://animal-superpowers-xz86.vercel.app/

## How the two halves connect

- A user browsing the mammal tree opens a species, reads its superpower reviews, and sees citations with DOIs. Next to each citation there is a **Score for translation →** link.
- That link navigates to `/translate?species={scientificName}&sp={superpowerKey}&ref={citationLabel}`.
- The Translate page reads those query params on mount. If the (species, superpower) pair matches a known training case (e.g. `Loxodonta africana::cancer_resistance` → case N30, elephant LIF6), the 13 features load from the training case. Otherwise the sliders stay at defaults with a context banner showing what's being scored.
- From the Translate page, the same header nav returns the user to the mammal tree.

The mapping table is in `lib/training.ts` under `speciesReviewToCase`. Extending it is a one-line add per species-superpower pair.

## The Translational Discovery model

- **Task:** predict whether an animal finding translates to an approved drug or sustained clinical use.
- **Data:** 61 curated historical cases (16 translators, 45 non-translators), stored in `data/training_cases.json`.
- **Model:** L2-regularized logistic regression with 13 features (see below). When the `human_cell_validation` and `assay_translatability` features are not provided, an 11-feature **Pre-HC** model runs automatically — predicting the likelihood of advancing to human-cell testing instead.
- **Validation:**
  - Leave-one-out CV AUC **0.975** (full), **0.968** (Pre-HC)
  - Blind-coded independent re-scoring AUC **0.964**
  - Permutation test *p* < 0.003
- **Bootstrap CIs** on every coefficient are propagated through the sigmoid to produce the 95% band shown in the score panel.

### The 13 features

| Group | Feature |
|---|---|
| Modality (binary) | `is_secreted_product`, `is_small_molecule_or_peptide`, `requires_expression_system`, `phenotype_is_organismal` |
| Mechanism (0–10) | `mechanism_clarity`, `ortholog_conservation`, `target_druggability`, `pathway_redundancy`, `effect_size_reported` |
| Evidence (0–10, optional) | `cross_species_consistency`, `human_cell_validation`, `assay_translatability`, `regulatory_precedent` |

## Routes

- **`/`** — mammal tree + sidebar filter + species detail panel with citations.
- **`/translate`** — tabbed page:
  - *Evaluate one study* — the scoring form, result card with probability/CI/tier, top-3 pushing-up / pushing-down feature contributions, and three nearest training cases.
  - *Explore & rank set* — all 61 cases sortable by predicted probability, filterable by outcome/modality/search, with a correctness indicator (TP/TN/FP/FN) for each. Click any row to inspect details and load its features into the Evaluate tab.
  - *Methodology* (below both tabs) — feature-importance forest plot with bootstrap CIs and sign-consistency values; dot plot of all 61 cases at their leave-one-out predicted probability (blue = translated, red = did not); and four worked examples (true positives, true negative, one instructive false positive).

## Structure

```
app/
  layout.tsx             Shared header: Mammal tree · Translational Discovery
  page.tsx               The mammal tree
  translate/page.tsx     Translational Discovery (tabs + methodology)
  globals.css
components/
  MammalTree.tsx         D3 radial cluster (client)
  FilterSidebar.tsx      Superpower filter
  SpeciesDetail.tsx      Species modal + per-citation "Score for translation →"
  ScoreForm.tsx          13-feature input (modality toggles + sliders + evidence)
  ScoreResult.tsx        Probability, CI band, tier, contributors, mode banner
  SimilarCases.tsx       Three nearest neighbors from training set
  FeatureImportanceChart.tsx  Forest plot of coefficients with bootstrap CIs
  CaseSpectrum.tsx       Dot plot of 61 training cases, hover-enabled
  WorkedExamples.tsx     Canonical TP / TN / instructive-FP cards
lib/
  model.ts               Logistic regression (full + Pre-HC), bootstrap CIs, findSimilar
  types.ts               Species / taxonomy types
  data.ts                species.json import
  training.ts            Training-case types, data import, species→case mapping
data/
  species.json           ~40 curated mammals, ~21 flagship reviews w/ DOI citations
  training_cases.json    61 cases with features, outcomes, LOO predictions
```

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## Deploy

Pushing to the `main` branch of https://github.com/dsfitzpa/Animal-Superpowers auto-deploys to https://animal-superpowers-xz86.vercel.app/ via Vercel. The `vercel.json` pins the Next.js framework preset.

## Limitations

- Human therapeutic targets are drawn from comparative-biology papers and are speculative — they point to pathways worth studying, not approved therapies.
- The Translational Discovery 95% CI reflects statistical uncertainty in the coefficients given n=61. It does **not** reflect uncertainty in the user's slider values, missing features, or model misspecification. Adding a feature with a high-uncertainty coefficient (e.g. `regulatory_precedent`) can widen the band — this is correct behavior.
- The `speciesReviewToCase` map in `lib/training.ts` only covers the handful of species-superpower pairs that have a direct match in the training set. Unmapped pairs open the Translate page at defaults with a context banner.

## License

MIT for code. Citations and mechanism descriptions reference the underlying publications — consult the originals for canonical claims.
