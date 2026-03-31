CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text DEFAULT 'momo' NOT NULL,
	`is_admin` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`context` text NOT NULL,
	`role_a_name` text NOT NULL,
	`role_a_public_goal` text NOT NULL,
	`role_b_name` text NOT NULL,
	`role_b_public_goal` text NOT NULL,
	`boundary_constraints` text NOT NULL,
	`turn_count` integer DEFAULT 10 NOT NULL,
	`judge_rounds` integer DEFAULT 3 NOT NULL,
	`judge_prompt` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`scenario_id` text NOT NULL,
	`prompt_a` text NOT NULL,
	`prompt_b` text NOT NULL,
	`model` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `playground_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` integer NOT NULL,
	`scenario_id` text NOT NULL,
	`transcript` text DEFAULT '[]' NOT NULL,
	`judge_transcript_a` text DEFAULT '[]' NOT NULL,
	`judge_transcript_b` text DEFAULT '[]' NOT NULL,
	`score_a` real,
	`score_b` real,
	`winner` text,
	`reasoning` text,
	`error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scenario_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`total_rounds` integer DEFAULT 4 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `tournaments_status_check` CHECK(`status` in ('open', 'running', 'finished'))
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tournament_id` integer NOT NULL,
	`round_number` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `rounds_status_check` CHECK(`status` in ('pairing', 'running', 'done'))
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round_id` integer NOT NULL,
	`scenario_id` text NOT NULL,
	`sub_a_id` integer NOT NULL,
	`sub_b_id` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`current_turn` integer DEFAULT 0 NOT NULL,
	`transcript` text DEFAULT '[]' NOT NULL,
	`judge_transcript_a` text DEFAULT '[]' NOT NULL,
	`judge_transcript_b` text DEFAULT '[]' NOT NULL,
	`score_a` real,
	`score_b` real,
	`winner` text,
	`reasoning` text,
	`error` text,
	`lease_token` text,
	`started_at` text,
	`finished_at` text,
	`updated_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`scenario_id`) REFERENCES `scenarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sub_a_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sub_b_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `matches_status_check` CHECK(`status` in ('queued', 'running', 'judging', 'scored', 'error')),
	CONSTRAINT `matches_winner_check` CHECK(`winner` in ('a', 'b', 'draw') or `winner` is null)
);
