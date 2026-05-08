import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { plants } from "./layer1";

export const plantMetrics = sqliteTable("plant_metrics", {
  plantId: integer("plant_id")
    .primaryKey()
    .references(() => plants.id),
  climateScoreByRegion: text("climate_score_by_region", {
    mode: "json"
  }).$type<Record<string, number>>(),
  petSafetyScoreDog: integer("pet_safety_score_dog"),
  petSafetyScoreCat: integer("pet_safety_score_cat"),
  childSafetyScore: integer("child_safety_score"),
  toxicityNotes: text("toxicity_notes"),
  difficultyScore: integer("difficulty_score"),
  indoorOutdoorClass: text("indoor_outdoor_class"),
  lightLuxMin: integer("light_lux_min"),
  lightLuxMax: integer("light_lux_max"),
  waterFreqDays: integer("water_freq_days"),
  tempMinC: real("temp_min_c"),
  tempMaxC: real("temp_max_c"),
  humidityMinPct: integer("humidity_min_pct"),
  humidityMaxPct: integer("humidity_max_pct"),
  flowerMeaning: text("flower_meaning", { mode: "json" }).$type<{
    primary?: string;
    byColor?: Record<string, string>;
    byCulture?: { ko?: string; cn?: string; jp?: string; west?: string };
    giftOccasions?: string[];
  }>(),
  derivedAt: integer("derived_at", { mode: "timestamp" }).notNull()
});

export const plantTaxonomyPath = sqliteTable(
  "plant_taxonomy_path",
  {
    plantId: integer("plant_id")
      .primaryKey()
      .references(() => plants.id),
    pathSlash: text("path_slash").notNull(),
    depth: integer("depth").notNull(),
    category: text("category")
  },
  (table) => ({
    pathIdx: index("plant_taxonomy_path_path_idx").on(table.pathSlash),
    categoryIdx: index("plant_taxonomy_path_category_idx").on(table.category)
  })
);
