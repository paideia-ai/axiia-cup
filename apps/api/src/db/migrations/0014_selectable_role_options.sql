ALTER TABLE `scenarios` ADD COLUMN `role_a_options` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `scenarios` ADD COLUMN `role_b_options` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `submissions` ADD COLUMN `role_a_option_id` text;
--> statement-breakpoint
ALTER TABLE `submissions` ADD COLUMN `role_b_option_id` text;
