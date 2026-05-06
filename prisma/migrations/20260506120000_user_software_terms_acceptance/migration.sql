-- AlterTable
ALTER TABLE `users` ADD COLUMN `software_terms_accepted_at` DATETIME(3) NULL,
    ADD COLUMN `software_terms_version` VARCHAR(191) NULL;
