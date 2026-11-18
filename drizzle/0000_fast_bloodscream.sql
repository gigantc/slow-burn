CREATE TABLE `cook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`cook_id` text NOT NULL,
	`type` text NOT NULL,
	`at` text NOT NULL,
	`value` real,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`cook_id`) REFERENCES `cooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cooks` (
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
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
