ALTER TABLE `playground_runs` ADD `judge_os_failed_turns` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `playground_runs` ADD `judge_os_provenance` text;
--> statement-breakpoint
ALTER TABLE `matches` ADD `judge_os_failed_turns` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `matches` ADD `judge_os_provenance` text;
