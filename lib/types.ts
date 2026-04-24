export type Rank = "class" | "superorder" | "order" | "family" | "subfamily" | "species";

export interface TaxonNode {
  name: string;
  rank: Rank;
  common?: string;
  children?: TaxonNode[];
}

export interface Citation {
  label: string;
  doi?: string;
  pmid?: string;
  url?: string;
}

export interface Review {
  summary: string;
  human_targets: string[];
  citations: Citation[];
}

export interface SpeciesRecord {
  common: string;
  lifespan_years?: number;
  body_mass_g?: number;
  image_hint?: string;
  superpowers: string[];
  headline: string;
  reviews: Record<string, Review>;
}

export interface SuperpowerMeta {
  label: string;
  color: string;
  description: string;
}

export interface SpeciesDataset {
  superpowers: Record<string, SuperpowerMeta>;
  taxonomy: TaxonNode;
  species_data: Record<string, SpeciesRecord>;
}
