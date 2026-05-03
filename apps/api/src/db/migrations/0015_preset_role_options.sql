ALTER TABLE `preset_opponents` ADD COLUMN `role_option_id` text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `preset_opponents_scenario_role_option_idx`
ON `preset_opponents` (`scenario_id`, `role`, `role_option_id`);
