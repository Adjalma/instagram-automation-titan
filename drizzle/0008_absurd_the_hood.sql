ALTER TABLE `instagram_accounts` ADD `accessToken` text;--> statement-breakpoint
ALTER TABLE `instagram_accounts` ADD `tokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `instagram_accounts` ADD `linkedinUrn` varchar(256);