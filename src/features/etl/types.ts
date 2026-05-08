export type EtlSource = "kfri" | "nibr" | "nongsaro_garden";

export type RawPlantRecord = Record<string, unknown>;

export type PlantSourceRefs = {
  국립수목원?: string;
  국립생물자원관?: string;
  위키피디아?: string;
  농사로?: string;
};

export type NormalizedPlant = {
  scientificName: string;
  koreanName: string;
  slug: string;
  family: string | null;
  genus: string | null;
  synonyms: string[];
  origin: string | null;
  sourceRefs: PlantSourceRefs;
};

export type RejectedRecord = {
  source: EtlSource;
  reason: string;
  record: RawPlantRecord;
};

export type NormalizedPlantBatch = {
  accepted: NormalizedPlant[];
  rejected: RejectedRecord[];
};
