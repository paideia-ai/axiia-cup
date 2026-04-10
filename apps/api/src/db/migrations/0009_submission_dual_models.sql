ALTER TABLE `submissions` ADD COLUMN `model_a` text NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE `submissions` ADD COLUMN `model_b` text NOT NULL DEFAULT '';
--> statement-breakpoint

UPDATE `submissions`
SET
  `model_a` = `model`,
  `model_b` = `model`
WHERE `model_a` = '' OR `model_b` = '';
