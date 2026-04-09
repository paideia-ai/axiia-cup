CREATE INDEX IF NOT EXISTS `submissions_scenario_id_created_at_idx`
ON `submissions` (`scenario_id`, `created_at`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `playground_runs_status_created_at_idx`
ON `playground_runs` (`status`, `created_at`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `playground_runs_submission_id_created_at_idx`
ON `playground_runs` (`submission_id`, `created_at`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `rounds_tournament_id_round_number_idx`
ON `rounds` (`tournament_id`, `round_number`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `matches_round_id_idx`
ON `matches` (`round_id`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `matches_status_created_at_idx`
ON `matches` (`status`, `created_at`);
