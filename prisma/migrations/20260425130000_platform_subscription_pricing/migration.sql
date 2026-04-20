-- AlterTable
ALTER TABLE `platform_recurrente_settings` ADD COLUMN `subscription_price_gtq` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `platform_recurrente_settings` ADD COLUMN `subscription_period_months` INTEGER NULL;
