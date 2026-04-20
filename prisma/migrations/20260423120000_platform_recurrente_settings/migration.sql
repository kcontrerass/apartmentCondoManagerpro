-- CreateTable
CREATE TABLE `platform_recurrente_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `public_key` TEXT NULL,
    `secret_key` TEXT NULL,
    `webhook_secret` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
