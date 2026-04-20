-- AlterTable
ALTER TABLE `platform_fee_payments` ADD COLUMN `payment_method` ENUM('CARD', 'BANK_TRANSFER') NOT NULL DEFAULT 'CARD';

-- AlterTable
ALTER TABLE `platform_recurrente_settings` ADD COLUMN `bank_transfer_instructions` TEXT NULL;
