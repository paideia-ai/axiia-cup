ALTER TABLE `submissions` ADD COLUMN `retired_at` text;
--> statement-breakpoint

-- Repair the old 0002 model-refresh migration, which rewrote historical
-- submissions to current model IDs without preserving that they belonged to
-- retired models. These exact tuples were recovered from the production backup
-- taken before the hotfix and are safe no-ops in other environments.
UPDATE `submissions`
SET
  `model` = CASE
    WHEN (
      (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 4 AND `created_at` = '2026-04-08 15:46:17' AND `model` = 'qwen3.5-397b-a17b')
      OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 7 AND `created_at` = '2026-04-08 16:12:57' AND `model` = 'qwen3.5-397b-a17b')
      OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 12 AND `created_at` = '2026-04-09 01:07:38' AND `model` = 'qwen3.5-397b-a17b')
      OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 14 AND `created_at` = '2026-04-09 01:31:50' AND `model` = 'qwen3.5-397b-a17b')
    ) THEN 'qwen3-32b'
    WHEN (
      (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 5 AND `created_at` = '2026-04-08 15:50:24' AND `model` = 'deepseek-v3.2')
      OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 8 AND `created_at` = '2026-04-08 16:13:00' AND `model` = 'deepseek-v3.2')
      OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 13 AND `created_at` = '2026-04-09 01:07:40' AND `model` = 'deepseek-v3.2')
    ) THEN 'minimax-m2.5'
    ELSE `model`
  END,
  `retired_at` = COALESCE(`retired_at`, CURRENT_TIMESTAMP)
WHERE
  (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 4 AND `created_at` = '2026-04-08 15:46:17' AND `model` = 'qwen3.5-397b-a17b')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 5 AND `created_at` = '2026-04-08 15:50:24' AND `model` = 'deepseek-v3.2')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 7 AND `created_at` = '2026-04-08 16:12:57' AND `model` = 'qwen3.5-397b-a17b')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 8 AND `created_at` = '2026-04-08 16:13:00' AND `model` = 'deepseek-v3.2')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 12 AND `created_at` = '2026-04-09 01:07:38' AND `model` = 'qwen3.5-397b-a17b')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 13 AND `created_at` = '2026-04-09 01:07:40' AND `model` = 'deepseek-v3.2')
  OR (`user_id` = 1 AND `scenario_id` = 'shangyang-court' AND `version` = 14 AND `created_at` = '2026-04-09 01:31:50' AND `model` = 'qwen3.5-397b-a17b');
