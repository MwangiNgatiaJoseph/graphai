CREATE TABLE `ctf_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`difficulty` enum('easy','medium','hard','expert') NOT NULL,
	`flag` varchar(255) NOT NULL,
	`solution` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ctf_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `educational_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('web_security','network_security','cryptography','reverse_engineering','forensics','malware_analysis') NOT NULL,
	`content` text,
	`author_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `educational_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`scan_type` enum('network','web','vulnerability','code') NOT NULL,
	`target` varchar(255) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`results` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `security_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vulnerability_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scan_id` int,
	`user_id` int NOT NULL,
	`vulnerability_name` varchar(255) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`description` text,
	`recommendation` text,
	`status` enum('open','fixed','false_positive') NOT NULL DEFAULT 'open',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vulnerability_reports_id` PRIMARY KEY(`id`)
);
