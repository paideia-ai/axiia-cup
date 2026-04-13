PRAGMA foreign_keys=OFF;
--> statement-breakpoint

CREATE TABLE `__new_tournaments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `scenario_id` text NOT NULL REFERENCES `scenarios`(`id`),
  `status` text NOT NULL DEFAULT 'open' CHECK(`status` in ('open', 'running', 'finished', 'terminated')),
  `current_round` integer NOT NULL DEFAULT 0,
  `total_rounds` integer NOT NULL DEFAULT 4,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint

INSERT INTO `__new_tournaments` (
  `id`,
  `scenario_id`,
  `status`,
  `current_round`,
  `total_rounds`,
  `created_at`
)
SELECT
  `id`,
  `scenario_id`,
  `status`,
  `current_round`,
  `total_rounds`,
  `created_at`
FROM `tournaments`;
--> statement-breakpoint

DROP TABLE `tournaments`;
--> statement-breakpoint

ALTER TABLE `__new_tournaments` RENAME TO `tournaments`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
