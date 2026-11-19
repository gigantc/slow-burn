CREATE TABLE `tastings` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`maker` text,
	`tasted_on` text,
	`rating` integer,
	`notes` text,
	`details` text DEFAULT '{}' NOT NULL,
	`source` text DEFAULT 'app' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tastings_category_idx` ON `tastings` (`category`);