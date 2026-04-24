import raw from "@/data/species.json";
import type { SpeciesDataset } from "./types";

export const dataset = raw as unknown as SpeciesDataset;
