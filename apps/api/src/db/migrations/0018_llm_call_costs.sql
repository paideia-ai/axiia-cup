ALTER TABLE `llm_calls` ADD `cached_tokens` integer;--> statement-breakpoint
ALTER TABLE `llm_calls` ADD `reasoning_tokens` integer;--> statement-breakpoint
ALTER TABLE `llm_calls` ADD `cost_cny` real;
