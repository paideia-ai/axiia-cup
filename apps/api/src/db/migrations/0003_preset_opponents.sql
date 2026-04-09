-- Preset opponent prompts managed by admin, per scenario + role
CREATE TABLE `preset_opponents` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `role` text NOT NULL CHECK(`role` IN ('a', 'b')),
  `label` text NOT NULL,
  `prompt` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
-- Track which opponent mode was used and actual prompts for each playground run
ALTER TABLE `playground_runs` ADD COLUMN `opponent_mode` text NOT NULL DEFAULT 'self';
--> statement-breakpoint
ALTER TABLE `playground_runs` ADD COLUMN `preset_opponent_id` integer REFERENCES `preset_opponents`(`id`);
--> statement-breakpoint
ALTER TABLE `playground_runs` ADD COLUMN `actual_prompt_a` text;
--> statement-breakpoint
ALTER TABLE `playground_runs` ADD COLUMN `actual_prompt_b` text;
