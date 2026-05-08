CREATE TABLE `plant_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`url` text NOT NULL,
	`source` text NOT NULL,
	`license` text NOT NULL,
	`attribution` text,
	`is_primary` integer DEFAULT false,
	`width` integer,
	`height` integer,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `plant_images_plant_idx` ON `plant_images` (`plant_id`);--> statement-breakpoint
CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scientific_name` text NOT NULL,
	`korean_name` text NOT NULL,
	`slug` text NOT NULL,
	`family` text,
	`genus` text,
	`synonyms` text,
	`origin` text,
	`gbif_id` text,
	`wiki_url_ko` text,
	`source_refs` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plants_scientific_name_unique` ON `plants` (`scientific_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `plants_slug_unique` ON `plants` (`slug`);--> statement-breakpoint
CREATE INDEX `plants_family_idx` ON `plants` (`family`);--> statement-breakpoint
CREATE INDEX `plants_genus_idx` ON `plants` (`genus`);--> statement-breakpoint
CREATE INDEX `plants_slug_idx` ON `plants` (`slug`);--> statement-breakpoint
CREATE TABLE `region_climate` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`region_code` text NOT NULL,
	`month` integer NOT NULL,
	`avg_temp_c` real,
	`min_temp_c` real,
	`max_temp_c` real,
	`precipitation_mm` real,
	`humidity_pct` real,
	`sunshine_hours` real,
	`source` text DEFAULT 'KMA',
	FOREIGN KEY (`region_code`) REFERENCES `regions`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `region_climate_region_month_idx` ON `region_climate` (`region_code`,`month`);--> statement-breakpoint
CREATE TABLE `regions` (
	`code` text PRIMARY KEY NOT NULL,
	`sido` text NOT NULL,
	`sigungu` text NOT NULL,
	`latitude` real,
	`longitude` real
);
--> statement-breakpoint
CREATE TABLE `plant_metrics` (
	`plant_id` integer PRIMARY KEY NOT NULL,
	`climate_score_by_region` text,
	`pet_safety_score_dog` integer,
	`pet_safety_score_cat` integer,
	`child_safety_score` integer,
	`toxicity_notes` text,
	`difficulty_score` integer,
	`indoor_outdoor_class` text,
	`light_lux_min` integer,
	`light_lux_max` integer,
	`water_freq_days` integer,
	`temp_min_c` real,
	`temp_max_c` real,
	`humidity_min_pct` integer,
	`humidity_max_pct` integer,
	`flower_meaning` text,
	`derived_at` integer NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `plant_taxonomy_path` (
	`plant_id` integer PRIMARY KEY NOT NULL,
	`path_slash` text NOT NULL,
	`depth` integer NOT NULL,
	`category` text,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `plant_taxonomy_path_path_idx` ON `plant_taxonomy_path` (`path_slash`);--> statement-breakpoint
CREATE INDEX `plant_taxonomy_path_category_idx` ON `plant_taxonomy_path` (`category`);--> statement-breakpoint
CREATE TABLE `care_guides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`body_markdown` text NOT NULL,
	`quality_score` real,
	`published_at` integer,
	`is_published` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `care_guides_slug_unique` ON `care_guides` (`slug`);--> statement-breakpoint
CREATE INDEX `care_guides_slug_idx` ON `care_guides` (`slug`);--> statement-breakpoint
CREATE INDEX `care_guides_published_idx` ON `care_guides` (`is_published`,`published_at`);--> statement-breakpoint
CREATE TABLE `dedup_embeddings` (
	`content_id` integer PRIMARY KEY NOT NULL,
	`plant_id` integer NOT NULL,
	`embedding_pool` text NOT NULL,
	`embedding` text,
	FOREIGN KEY (`content_id`) REFERENCES `plant_content`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `dedup_embeddings_pool_idx` ON `dedup_embeddings` (`embedding_pool`);--> statement-breakpoint
CREATE TABLE `dictionary_categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`parent_slug` text,
	`plant_count` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `plant_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`summary_one_liner` text,
	`quick_facts_json` text,
	`care_guide_intro` text,
	`care_guide_water` text,
	`care_guide_light` text,
	`care_guide_temperature` text,
	`care_guide_repotting` text,
	`care_guide_pest` text,
	`flower_meaning_text` text,
	`faq_json` text,
	`quality_score` real,
	`quality_breakdown` text,
	`generated_by` text DEFAULT 'gemini-2.5-pro',
	`published_at` integer,
	`last_revalidated_at` integer,
	`is_published` integer DEFAULT false,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plant_content_plant_id_unique` ON `plant_content` (`plant_id`);--> statement-breakpoint
CREATE INDEX `plant_content_published_idx` ON `plant_content` (`is_published`,`published_at`);--> statement-breakpoint
CREATE TABLE `tools_results` (
	`cache_key` text PRIMARY KEY NOT NULL,
	`region_code` text NOT NULL,
	`environment` text NOT NULL,
	`pet_type` text,
	`experience` text,
	`result_plant_ids` text,
	`computed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lint_violations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`rule` text NOT NULL,
	`word` text,
	`field` text,
	`detected_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stage` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text NOT NULL,
	`input_count` integer,
	`output_count` integer,
	`rejected_count` integer,
	`error_log` text,
	`meta` text
);
--> statement-breakpoint
CREATE TABLE `publish_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer,
	`guide_id` integer,
	`scheduled_for` integer NOT NULL,
	`priority` integer DEFAULT 50,
	`attempts` integer DEFAULT 0,
	`status` text DEFAULT 'queued'
);
--> statement-breakpoint
CREATE INDEX `publish_queue_scheduled_idx` ON `publish_queue` (`status`,`scheduled_for`);--> statement-breakpoint
CREATE TABLE `quality_gate_failures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer,
	`content_id` integer,
	`gate` text NOT NULL,
	`reason` text NOT NULL,
	`detected_at` integer NOT NULL,
	`resolved` integer DEFAULT false
);
