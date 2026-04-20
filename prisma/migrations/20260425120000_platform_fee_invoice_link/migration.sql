-- AlterTable
ALTER TABLE `platform_fee_payments` ADD COLUMN `invoice_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `platform_fee_payments_invoice_id_key` ON `platform_fee_payments`(`invoice_id`);

-- AddForeignKey
ALTER TABLE `platform_fee_payments` ADD CONSTRAINT `platform_fee_payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
