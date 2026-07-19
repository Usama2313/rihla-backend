CREATE TABLE `booking_records` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`customer_name` text NOT NULL,
	`email` text,
	`phone` text,
	`details_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`business_name` text DEFAULT 'Rihla' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`facebook` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`x` text DEFAULT '' NOT NULL,
	`linkedin` text DEFAULT '' NOT NULL,
	`tiktok` text DEFAULT '' NOT NULL,
	`youtube` text DEFAULT '' NOT NULL,
	`snapchat` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
