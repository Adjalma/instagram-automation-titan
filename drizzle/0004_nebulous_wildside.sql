CREATE TABLE `triac_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('servico','projeto') NOT NULL,
	`name` varchar(256) NOT NULL,
	`subtitle` varchar(256),
	`description` text NOT NULL,
	`category` varchar(128),
	`technologies` text,
	`highlights` text,
	`status` enum('ativo','em_desenvolvimento','em_breve') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `triac_content_id` PRIMARY KEY(`id`)
);
