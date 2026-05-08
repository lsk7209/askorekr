import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { plants } from "./layer1";

export const plantContent = sqliteTable(
  "plant_content",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id)
      .unique(),
    summaryOneLiner: text("summary_one_liner"),
    quickFactsJson: text("quick_facts_json", { mode: "json" }).$type<
      { label: string; value: string; unit?: string }[]
    >(),
    careGuideIntro: text("care_guide_intro"),
    careGuideWater: text("care_guide_water"),
    careGuideLight: text("care_guide_light"),
    careGuideTemperature: text("care_guide_temperature"),
    careGuideRepotting: text("care_guide_repotting"),
    careGuidePest: text("care_guide_pest"),
    flowerMeaningText: text("flower_meaning_text"),
    faqJson: text("faq_json", { mode: "json" }).$type<
      { q: string; a: string }[]
    >(),
    qualityScore: real("quality_score"),
    qualityBreakdown: text("quality_breakdown", { mode: "json" }).$type<{
      eeat: number;
      persona: number;
      seo: number;
      factual: number;
      aiCliche: number;
    }>(),
    generatedBy: text("generated_by").default("gemini-2.5-pro"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    lastRevalidatedAt: integer("last_revalidated_at", { mode: "timestamp" }),
    isPublished: integer("is_published", { mode: "boolean" }).default(false)
  },
  (table) => ({
    publishedIdx: index("plant_content_published_idx").on(
      table.isPublished,
      table.publishedAt
    )
  })
);

export const careGuides = sqliteTable(
  "care_guides",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: text("category"),
    bodyMarkdown: text("body_markdown").notNull(),
    qualityScore: real("quality_score"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    isPublished: integer("is_published", { mode: "boolean" }).default(false)
  },
  (table) => ({
    slugIdx: index("care_guides_slug_idx").on(table.slug),
    publishedIdx: index("care_guides_published_idx").on(
      table.isPublished,
      table.publishedAt
    )
  })
);

export const toolsResults = sqliteTable("tools_results", {
  cacheKey: text("cache_key").primaryKey(),
  regionCode: text("region_code").notNull(),
  environment: text("environment").notNull(),
  petType: text("pet_type"),
  experience: text("experience"),
  resultPlantIds: text("result_plant_ids", { mode: "json" }).$type<number[]>(),
  computedAt: integer("computed_at", { mode: "timestamp" }).notNull()
});

export const dictionaryCategories = sqliteTable("dictionary_categories", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  parentSlug: text("parent_slug"),
  plantCount: integer("plant_count").default(0)
});

export const dedupEmbeddings = sqliteTable(
  "dedup_embeddings",
  {
    contentId: integer("content_id")
      .primaryKey()
      .references(() => plantContent.id),
    plantId: integer("plant_id").notNull(),
    embeddingPool: text("embedding_pool").notNull(),
    embedding: text("embedding", { mode: "json" }).$type<number[]>()
  },
  (table) => ({
    poolIdx: index("dedup_embeddings_pool_idx").on(table.embeddingPool)
  })
);
