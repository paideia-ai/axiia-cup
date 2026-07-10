-- Add product-facing observability metadata for admin monitor and Langfuse links.

ALTER TABLE `llm_calls` ADD COLUMN `scenario_id` text REFERENCES `scenarios`(`id`);
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `source` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `purpose` text NOT NULL DEFAULT 'game' CHECK(`purpose` in ('game', 'rejudge'));
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `gateway_provider` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `underlying_provider` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `otel_trace_id` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `otel_span_id` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `langfuse_observation_id` text;
--> statement-breakpoint
ALTER TABLE `llm_calls` ADD COLUMN `langfuse_trace_url` text;
--> statement-breakpoint

UPDATE `llm_calls`
SET
  `source` = CASE
    WHEN `playground_run_id` IS NOT NULL THEN 'playground'
    ELSE 'tournament'
  END,
  `scenario_id` = COALESCE(
    (
      SELECT pr.`scenario_id`
      FROM `playground_runs` pr
      WHERE pr.`id` = `llm_calls`.`playground_run_id`
    ),
    (
      SELECT m.`scenario_id`
      FROM `matches` m
      WHERE m.`id` = `llm_calls`.`match_id`
    )
  ),
  `gateway_provider` = `provider`,
  `underlying_provider` = CASE
    WHEN `model` LIKE 'deepseek-%' THEN 'deepseek'
    WHEN `model` LIKE 'qwen%' THEN 'qwen'
    WHEN `model` LIKE 'kimi-%' THEN 'moonshot'
    WHEN `model` LIKE 'minimax-%' THEN 'minimax'
    WHEN `model` LIKE 'glm-%' THEN 'zai'
    WHEN `model` LIKE 'gpt-%' THEN 'openai'
    WHEN `model` LIKE 'claude-%' THEN 'anthropic'
    ELSE `provider`
  END;
--> statement-breakpoint

CREATE INDEX `llm_calls_scenario_id_idx` ON `llm_calls` (`scenario_id`);
--> statement-breakpoint
CREATE INDEX `llm_calls_underlying_provider_idx` ON `llm_calls` (`underlying_provider`);
--> statement-breakpoint
CREATE INDEX `llm_calls_monitor_dimensions_idx` ON `llm_calls` (`purpose`, `scenario_id`, `phase`, `underlying_provider`, `model`, `created_at`);
