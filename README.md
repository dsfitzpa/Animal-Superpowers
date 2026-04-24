# Animal Superpowers — A Therapeutic Mammal Tree

An interactive radial phylogeny of mammals that have evolved extreme biological adaptations — extended lifespan, cancer resistance, viral tolerance, DNA repair, hibernation, tissue regeneration — mapped to the human therapeutic pathways their biology suggests.

Inspired by the [Zoonomia Project mammal tree](https://zoonomiaproject.org/the-mammal-tree-view/). Built as a 6-hour hackathon prototype.

**Live demo:** https://animal-superpowers-xz86.vercel.app/

## What it does

- Renders ~40 curated mammals in a radial cluster phylogeny (D3 + React).
- A sidebar of 8 "superpower" traits filters the tree — selecting *Longevity* or *Viral Tolerance* highlights species that exhibit the trait and dims the rest.
- Clicking a species opens a detail panel with:
  - A short mechanism review written from primary literature
  - Candidate human therapeutic targets (genes, pathways, drug classes)
  - References with resolvable DOI links

## Data

All curation lives in [`data/species.json`](data/species.json):

- **8 superpowers** — longevity, cancer resistance, DNA repair, viral tolerance, innate immunity, hypoxia tolerance, hibernation, regeneration
- **~40 species** across Afrotheria, Xenarthra, Euarchontoglires, and Laurasiatheria
- **~20 fully-annotated "flagship" species** with mechanism reviews and citations; the rest are phylogenetic context
- **Every citation is a real paper** — DOIs resolve via doi.org. Flagship sources include Firsanov et al. 2025 (bowhead CIRBP, *Nature*), Abegglen 2015 (elephant TP53, *JAMA*), Ahn 2023 (bat ASC2, *Cell*), Tian 2013 (naked mole-rat HMM-HA, *Nature*), Seifert 2012 (spiny mouse regeneration, *Nature*), and others.

## Stack

- Next.js 14 (App Router) + TypeScript
- D3 v7 for the radial layout
- Tailwind CSS
- react-markdown for review rendering
- Deployed to Vercel (auto-deploy from `main`)

## Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Project layout

```
app/
  layout.tsx        Root layout + metadata
  page.tsx          Main view — tree + sidebar + detail panel
  globals.css       Dark theme + tree styles
components/
  MammalTree.tsx    D3 radial cluster tree (client component)
  FilterSidebar.tsx Superpower checkboxes with match counts
  SpeciesDetail.tsx Modal panel with reviews + citations
data/
  species.json     All taxonomy, superpowers, reviews, citations
lib/
  types.ts         Shared TypeScript interfaces
  data.ts          JSON import + type cast
```

## Notes & caveats

- This is a prototype. Human therapeutic targets are drawn from comparative-biology papers and are speculative — they point to pathways worth studying, not approved therapies.
- The taxonomy is curated for visual density rather than phylogenetic completeness. Adding a species is a matter of inserting into `taxonomy` and `species_data` in `data/species.json`.
- Citations were surfaced by literature search during curation; flagship DOIs were spot-checked, but please verify any citation you intend to rely on.

## License

MIT for code. Citations and mechanism descriptions reference the underlying publications — consult the originals for canonical claims.
