ALTER TABLE `playground_runs`
ADD COLUMN `preset_opponent_role` text;
--> statement-breakpoint

ALTER TABLE `playground_runs`
ADD COLUMN `preset_opponent_label` text;
--> statement-breakpoint

ALTER TABLE `playground_runs`
ADD COLUMN `started_at` text;
--> statement-breakpoint

ALTER TABLE `playground_runs`
ADD COLUMN `finished_at` text;
--> statement-breakpoint

UPDATE `playground_runs`
SET
  `preset_opponent_role` = (
    SELECT `role`
    FROM `preset_opponents`
    WHERE `preset_opponents`.`id` = `playground_runs`.`preset_opponent_id`
  ),
  `preset_opponent_label` = (
    SELECT `label`
    FROM `preset_opponents`
    WHERE `preset_opponents`.`id` = `playground_runs`.`preset_opponent_id`
  )
WHERE `preset_opponent_id` IS NOT NULL;
--> statement-breakpoint

UPDATE `playground_runs`
SET `started_at` = COALESCE(`updated_at`, `created_at`)
WHERE `started_at` IS NULL AND `status` IN ('running', 'scored', 'error');
--> statement-breakpoint

UPDATE `playground_runs`
SET `finished_at` = `updated_at`
WHERE `finished_at` IS NULL AND `status` IN ('scored', 'error');
