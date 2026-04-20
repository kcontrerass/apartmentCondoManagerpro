-- AlterTable
ALTER TABLE `complexes` ADD COLUMN `platform_paid_until` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `platform_fee_payments` (
    `id` VARCHAR(191) NOT NULL,
    `complex_id` VARCHAR(191) NOT NULL,
    `amount_cents` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GTQ',
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `recurrente_checkout_id` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `period_months` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `platform_fee_payments_complex_id_idx`(`complex_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `platform_fee_payments` ADD CONSTRAINT `platform_fee_payments_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
