ALTER TABLE `cook_events` ADD `updated_at` text DEFAULT '1970-01-01T00:00:00.000Z' NOT NULL;--> statement-breakpoint
CREATE INDEX `cook_events_cook_idx` ON `cook_events` (`cook_id`);--> statement-breakpoint
ALTER TABLE `cooks` ADD `protein_key` text;--> statement-breakpoint
CREATE INDEX `cooks_protein_key_idx` ON `cooks` (`protein_key`);