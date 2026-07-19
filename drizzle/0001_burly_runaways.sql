CREATE TABLE `umrah_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`badge` text DEFAULT 'Umrah package' NOT NULL,
	`nights` text NOT NULL,
	`hotel` text NOT NULL,
	`price` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
