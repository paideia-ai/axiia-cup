-- Drop content-only fields (admin now writes these directly in prompt templates)
ALTER TABLE `scenarios` DROP COLUMN `context`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `boundary_constraints`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `judge_name`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_a_public_identity`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_b_public_identity`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_a_main_goal`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_b_main_goal`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_a_stance`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `role_b_stance`;
--> statement-breakpoint
-- Drop scoring fields (replaced by scorer prompt)
ALTER TABLE `scenarios` DROP COLUMN `main_goal_score`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `true_request_score`;
--> statement-breakpoint
ALTER TABLE `scenarios` DROP COLUMN `false_request_penalty`;
--> statement-breakpoint
-- Add scorer prompt template
ALTER TABLE `scenarios` ADD COLUMN `scorer_prompt` text NOT NULL DEFAULT '';
