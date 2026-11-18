DROP INDEX `cooks_protein_key_idx`;--> statement-breakpoint
CREATE INDEX `cooks_meat_idx` ON `cooks` (`meat_id`);--> statement-breakpoint
ALTER TABLE `cooks` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `cooks` DROP COLUMN `protein`;--> statement-breakpoint
ALTER TABLE `cooks` DROP COLUMN `protein_key`;--> statement-breakpoint
ALTER TABLE `cooks` DROP COLUMN `cut`;