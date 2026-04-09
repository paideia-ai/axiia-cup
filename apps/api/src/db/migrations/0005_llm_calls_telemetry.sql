-- Recreate llm_calls table to:
-- 1. Add prompt_tokens, completion_tokens, user_id columns
-- 2. Fix stale CHECK constraints (add 'scoring' phase, 'scorer' side)
-- 3. Backfill token data from responseJson and userId from joins

-- Step 1: Rename old table
ALTER TABLE `llm_calls` RENAME TO `llm_calls_old`;
--> statement-breakpoint

-- Step 2: Create new table with updated schema
CREATE TABLE `llm_calls` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `match_id` integer REFERENCES `matches`(`id`),
  `playground_run_id` integer REFERENCES `playground_runs`(`id`),
  `user_id` integer REFERENCES `users`(`id`),
  `phase` text NOT NULL CHECK(`phase` in ('dialogue', 'examination', 'judgment', 'scoring')),
  `side` text NOT NULL CHECK(`side` in ('a', 'b', 'judge', 'scorer')),
  `turn_index` integer,
  `attempt` integer NOT NULL DEFAULT 1 CHECK(`attempt` > 0),
  `model` text NOT NULL,
  `provider` text NOT NULL DEFAULT 'siliconflow',
  `request_json` text NOT NULL,
  `response_json` text,
  `response_content` text,
  `error` text,
  `duration_ms` integer NOT NULL CHECK(`duration_ms` >= 0),
  `prompt_tokens` integer,
  `completion_tokens` integer,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(
    (`match_id` is not null and `playground_run_id` is null) or
    (`match_id` is null and `playground_run_id` is not null)
  )
);
--> statement-breakpoint

-- Step 3: Copy data from old table
INSERT INTO `llm_calls` (
  `id`, `match_id`, `playground_run_id`, `phase`, `side`, `turn_index`,
  `attempt`, `model`, `provider`, `request_json`, `response_json`,
  `response_content`, `error`, `duration_ms`, `created_at`,
  `prompt_tokens`, `completion_tokens`
)
SELECT
  `id`, `match_id`, `playground_run_id`, `phase`, `side`, `turn_index`,
  `attempt`, `model`, `provider`, `request_json`, `response_json`,
  `response_content`, `error`, `duration_ms`, `created_at`,
  CASE
    WHEN `response_json` IS NOT NULL
    THEN json_extract(`response_json`, '$.usage.prompt_tokens')
    ELSE NULL
  END,
  CASE
    WHEN `response_json` IS NOT NULL
    THEN json_extract(`response_json`, '$.usage.completion_tokens')
    ELSE NULL
  END
FROM `llm_calls_old`;
--> statement-breakpoint

-- Step 4: Backfill user_id for playground run calls
UPDATE `llm_calls`
SET `user_id` = (
  SELECT s.`user_id`
  FROM `playground_runs` pr
  JOIN `submissions` s ON s.`id` = pr.`submission_id`
  WHERE pr.`id` = `llm_calls`.`playground_run_id`
)
WHERE `playground_run_id` IS NOT NULL;
--> statement-breakpoint

-- Step 5: Backfill user_id for match calls (side a → subA's user, side b → subB's user)
UPDATE `llm_calls`
SET `user_id` = (
  SELECT s.`user_id`
  FROM `matches` m
  JOIN `submissions` s ON s.`id` = CASE
    WHEN `llm_calls`.`side` = 'a' THEN m.`sub_a_id`
    WHEN `llm_calls`.`side` = 'b' THEN m.`sub_b_id`
    ELSE NULL
  END
  WHERE m.`id` = `llm_calls`.`match_id`
)
WHERE `match_id` IS NOT NULL AND `side` IN ('a', 'b');
--> statement-breakpoint

-- Step 6: Drop old table (also removes its indexes)
DROP TABLE `llm_calls_old`;
--> statement-breakpoint

-- Step 7: Recreate indexes on new table
CREATE INDEX `llm_calls_match_id_idx` ON `llm_calls` (`match_id`);
--> statement-breakpoint
CREATE INDEX `llm_calls_playground_run_id_idx` ON `llm_calls` (`playground_run_id`);
--> statement-breakpoint
CREATE INDEX `llm_calls_user_id_idx` ON `llm_calls` (`user_id`);
