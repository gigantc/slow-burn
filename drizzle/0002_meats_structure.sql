CREATE TABLE `meats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meats_name_key_idx` ON `meats` (`name_key`);--> statement-breakpoint
ALTER TABLE `cooks` ADD `target_internal_temp_f` integer;--> statement-breakpoint
ALTER TABLE `cooks` ADD `meat_id` text REFERENCES meats(id);