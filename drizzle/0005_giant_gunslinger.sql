CREATE TABLE `research_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`postId` int,
	`headlines` text,
	`status` enum('success','failed','skipped') NOT NULL,
	`error` text,
	`ranAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`query` varchar(512) NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'pt',
	`active` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `research_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `theme` text;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `mcpPending` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `retryCount` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `likes` int;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `comments` int;