ALTER TABLE `cook_events` ADD `updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL;--> statement-breakpoint
CREATE INDEX `cook_events_cook_idx` ON `cook_events` (`cook_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cooks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`protein` text,
	`cut` text,
	`weight_lbs` real,
	`prep` text,
	`smoker` text,
	`wood` text,
	`target_pit_temp_f` integer,
	`started_at` text,
	`ended_at` text,
	`final_internal_temp_f` integer,
	`rating` integer,
	`notes` text,
	`next_time_note` text,
	`source` text DEFAULT 'app' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "cooks_rating_range" CHECK("__new_cooks"."rating" is null or "__new_cooks"."rating" between 1 and 5)
);
--> statement-breakpoint
INSERT INTO `__new_cooks`("id", "name", "protein", "cut", "weight_lbs", "prep", "smoker", "wood", "target_pit_temp_f", "started_at", "ended_at", "final_internal_temp_f", "rating", "notes", "next_time_note", "source", "created_at", "updated_at") SELECT "id", "name", "protein", "cut", "weight_lbs", "prep", "smoker", "wood", "target_pit_temp_f", "started_at", "ended_at", "final_internal_temp_f", "rating", "notes", "next_time_note", "source", "created_at", "updated_at" FROM `cooks`;--> statement-breakpoint
DROP TABLE `cooks`;--> statement-breakpoint
ALTER TABLE `__new_cooks` RENAME TO `cooks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `cooks_protein_idx` ON `cooks` (`lower(trim("protein"))`);