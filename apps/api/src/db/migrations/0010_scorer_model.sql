ALTER TABLE `scenarios`
ADD COLUMN `scorer_model` text NOT NULL DEFAULT 'deepseek-v3.2';
--> statement-breakpoint

UPDATE `scenarios`
SET `scorer_model` = `judge_model`;
