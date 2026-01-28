/*
  Warnings:

  - A unique constraint covering the columns `[invoice_id]` on the table `reservations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `amenities` ADD COLUMN `requires_payment` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `payment_method` ENUM('CARD', 'CASH', 'TRANSFER') NULL,
    MODIFY `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'PROCESSING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `reservations` ADD COLUMN `invoice_id` VARCHAR(191) NULL,
    ADD COLUMN `payment_method` ENUM('CARD', 'CASH', 'TRANSFER') NULL,
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'PROCESSING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `services` ADD COLUMN `hasQuantity` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isRequired` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `unit_services` ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `units` ADD COLUMN `parking_spots` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `complex_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `visitor_logs` (
    `id` VARCHAR(191) NOT NULL,
    `visitor_name` VARCHAR(191) NOT NULL,
    `visitor_id_card` VARCHAR(191) NULL,
    `reason` TEXT NULL,
    `status` ENUM('SCHEDULED', 'ARRIVED', 'DEPARTED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `entry_time` DATETIME(3) NULL,
    `exit_time` DATETIME(3) NULL,
    `scheduled_date` DATETIME(3) NOT NULL,
    `unit_id` VARCHAR(191) NOT NULL,
    `complex_id` VARCHAR(191) NOT NULL,
    `created_by_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `reservations_invoice_id_key` ON `reservations`(`invoice_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_logs` ADD CONSTRAINT `visitor_logs_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_logs` ADD CONSTRAINT `visitor_logs_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitor_logs` ADD CONSTRAINT `visitor_logs_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
