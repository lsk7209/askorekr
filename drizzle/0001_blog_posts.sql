CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`meta_description` text,
	`category` text NOT NULL DEFAULT 'gardening',
	`tags` text DEFAULT '[]',
	`body_markdown` text NOT NULL,
	`quality_score` real,
	`quality_breakdown` text,
	`research_json` text,
	`generated_by` text DEFAULT 'gemini-2.5-pro',
	`scheduled_at` integer,
	`published_at` integer,
	`is_published` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_idx` ON `blog_posts` (`slug`);
--> statement-breakpoint
CREATE INDEX `blog_posts_published_idx` ON `blog_posts` (`is_published`,`published_at`);
--> statement-breakpoint
CREATE INDEX `blog_posts_scheduled_idx` ON `blog_posts` (`is_published`,`scheduled_at`);
--> statement-breakpoint
CREATE INDEX `blog_posts_category_idx` ON `blog_posts` (`category`);
