-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `payment_method_intent` ENUM('CARD', 'CASH', 'TRANSFER') NULL;
