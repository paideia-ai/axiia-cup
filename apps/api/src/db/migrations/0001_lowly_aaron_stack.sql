ALTER TABLE `playground_runs` ADD `status` text DEFAULT 'queued' NOT NULL;
--> statement-breakpoint
ALTER TABLE `playground_runs` ADD `lease_token` text;
