-- AlterTable
ALTER TABLE `platform_fee_payments` ADD COLUMN `terms_accepted_at` DATETIME(3) NULL,
    ADD COLUMN `terms_version` VARCHAR(191) NULL;
