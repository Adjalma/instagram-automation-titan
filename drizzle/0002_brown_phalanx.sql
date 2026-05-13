CREATE TABLE `publication_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`attempt` int NOT NULL DEFAULT 1,
	`status` enum('success','failed','pending') NOT NULL,
	`instagramPostId` varchar(256),
	`permalink` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publication_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `retryCount` int DEFAULT 0 NOT NULL;