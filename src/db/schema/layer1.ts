import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const plants = sqliteTable(
  "plants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scientificName: text("scientific_name").notNull().unique(),
    koreanName: text("korean_name").notNull(),
    slug: text("slug").notNull().unique(),
    family: text("family"),
    genus: text("genus"),
    synonyms: text("synonyms", { mode: "json" }).$type<string[]>(),
    origin: text("origin"),
    gbifId: text("gbif_id"),
    wikiUrlKo: text("wiki_url_ko"),
    sourceRefs: text("source_refs", { mode: "json" }).$type<{
      국립수목원?: string;
      국립생물자원관?: string;
      위키피디아?: string;
    }>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
  },
  (table) => ({
    familyIdx: index("plants_family_idx").on(table.family),
    genusIdx: index("plants_genus_idx").on(table.genus),
    slugIdx: index("plants_slug_idx").on(table.slug)
  })
);

export const plantImages = sqliteTable(
  "plant_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id),
    url: text("url").notNull(),
    source: text("source").notNull(),
    license: text("license").notNull(),
    attribution: text("attribution"),
    isPrimary: integer("is_primary", { mode: "boolean" }).default(false),
    width: integer("width"),
    height: integer("height")
  },
  (table) => ({
    plantIdx: index("plant_images_plant_idx").on(table.plantId)
  })
);

export const regions = sqliteTable("regions", {
  code: text("code").primaryKey(),
  sido: text("sido").notNull(),
  sigungu: text("sigungu").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude")
});

export const regionClimate = sqliteTable(
  "region_climate",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    regionCode: text("region_code")
      .notNull()
      .references(() => regions.code),
    month: integer("month").notNull(),
    avgTempC: real("avg_temp_c"),
    minTempC: real("min_temp_c"),
    maxTempC: real("max_temp_c"),
    precipitationMm: real("precipitation_mm"),
    humidityPct: real("humidity_pct"),
    sunshineHours: real("sunshine_hours"),
    source: text("source").default("KMA")
  },
  (table) => ({
    regionMonthIdx: index("region_climate_region_month_idx").on(
      table.regionCode,
      table.month
    )
  })
);
