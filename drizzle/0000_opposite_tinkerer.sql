CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`owner_name` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`mood` text DEFAULT '平静' NOT NULL,
	`memory_date` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`share_token` text,
	`image_key` text,
	`image_type` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_memories_user_created` ON `memories` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_memories_share_token` ON `memories` (`share_token`);
--> statement-breakpoint
PRAGMA optimize;
