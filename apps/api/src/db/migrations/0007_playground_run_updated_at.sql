ALTER TABLE `playground_runs`
ADD COLUMN `updated_at` text;
--> statement-breakpoint

UPDATE `playground_runs`
SET `updated_at` = `created_at`
WHERE `updated_at` IS NULL;
