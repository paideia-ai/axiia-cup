CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL,
  `password_hash` text NOT NULL,
  `display_name` text NOT NULL DEFAULT 'momo',
  `is_admin` integer NOT NULL DEFAULT false,
  `disabled` integer NOT NULL DEFAULT false,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `appSettings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `subject` text NOT NULL,
  `context` text NOT NULL,
  `boundary_constraints` text NOT NULL,
  `turn_count` integer NOT NULL DEFAULT 10,
  `judge_name` text NOT NULL DEFAULT '裁判',
  `judge_model` text NOT NULL DEFAULT 'deepseek-v3.2',
  `judge_prompt` text NOT NULL,
  `opening_line` text NOT NULL DEFAULT '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
  `agent_prompt_template` text NOT NULL,
  `examination_question_template` text NOT NULL,
  `role_a_name` text NOT NULL,
  `role_a_public_identity` text NOT NULL,
  `role_a_main_goal` text NOT NULL,
  `role_a_stance` text NOT NULL,
  `role_a_hidden_info` text NOT NULL DEFAULT '[]',
  `role_a_requests` text NOT NULL DEFAULT '[]',
  `role_b_name` text NOT NULL,
  `role_b_public_identity` text NOT NULL,
  `role_b_main_goal` text NOT NULL,
  `role_b_stance` text NOT NULL,
  `role_b_hidden_info` text NOT NULL DEFAULT '[]',
  `role_b_requests` text NOT NULL DEFAULT '[]',
  `false_info_count` integer NOT NULL DEFAULT 1,
  `true_request_count` integer NOT NULL DEFAULT 1,
  `main_goal_score` real NOT NULL DEFAULT 1,
  `true_request_score` real NOT NULL DEFAULT 0.5,
  `false_request_penalty` real NOT NULL DEFAULT -0.25,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `submissions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL REFERENCES `users`(`id`),
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `prompt_a` text NOT NULL,
  `prompt_b` text NOT NULL,
  `model` text NOT NULL,
  `version` integer NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `submissions_user_scenario_version` ON `submissions` (`user_id`, `scenario_id`, `version`);
--> statement-breakpoint
CREATE TABLE `playground_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `submission_id` integer NOT NULL REFERENCES `submissions`(`id`),
  `status` text NOT NULL DEFAULT 'queued',
  `lease_token` text,
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `transcript` text NOT NULL DEFAULT '[]',
  `judge_transcript_a` text NOT NULL DEFAULT '[]',
  `judge_transcript_b` text NOT NULL DEFAULT '[]',
  `info_assignment` text,
  `judge_decision` text,
  `score_a` real,
  `score_b` real,
  `winner` text,
  `reasoning` text,
  `error` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `status` text NOT NULL DEFAULT 'open' CHECK(`status` in ('open', 'running', 'finished')),
  `current_round` integer NOT NULL DEFAULT 0,
  `total_rounds` integer NOT NULL DEFAULT 4,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `rounds` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tournament_id` integer NOT NULL REFERENCES `tournaments`(`id`),
  `round_number` integer NOT NULL,
  `status` text NOT NULL CHECK(`status` in ('pairing', 'running', 'done'))
);
--> statement-breakpoint
CREATE TABLE `matches` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `round_id` integer NOT NULL REFERENCES `rounds`(`id`),
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `sub_a_id` integer NOT NULL REFERENCES `submissions`(`id`),
  `sub_b_id` integer NOT NULL REFERENCES `submissions`(`id`),
  `status` text NOT NULL DEFAULT 'queued' CHECK(`status` in ('queued', 'running', 'judging', 'scored', 'error')),
  `current_turn` integer NOT NULL DEFAULT 0,
  `transcript` text NOT NULL DEFAULT '[]',
  `judge_transcript_a` text NOT NULL DEFAULT '[]',
  `judge_transcript_b` text NOT NULL DEFAULT '[]',
  `info_assignment` text,
  `judge_decision` text,
  `score_a` real,
  `score_b` real,
  `winner` text CHECK(`winner` in ('a', 'b', 'draw') or `winner` is null),
  `reasoning` text,
  `error` text,
  `lease_token` text,
  `started_at` text,
  `finished_at` text,
  `updated_at` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `llm_calls` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `match_id` integer REFERENCES `matches`(`id`),
  `playground_run_id` integer REFERENCES `playground_runs`(`id`),
  `phase` text NOT NULL CHECK(`phase` in ('dialogue', 'examination', 'judgment')),
  `side` text NOT NULL CHECK(`side` in ('a', 'b', 'judge')),
  `turn_index` integer,
  `attempt` integer NOT NULL DEFAULT 1 CHECK(`attempt` > 0),
  `model` text NOT NULL,
  `provider` text NOT NULL DEFAULT 'siliconflow',
  `request_json` text NOT NULL,
  `response_json` text,
  `response_content` text,
  `error` text,
  `duration_ms` integer NOT NULL CHECK(`duration_ms` >= 0),
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(
    (`match_id` is not null and `playground_run_id` is null) or
    (`match_id` is null and `playground_run_id` is not null)
  )
);
--> statement-breakpoint
CREATE INDEX `llm_calls_match_id_idx` ON `llm_calls` (`match_id`);
--> statement-breakpoint
CREATE INDEX `llm_calls_playground_run_id_idx` ON `llm_calls` (`playground_run_id`);
