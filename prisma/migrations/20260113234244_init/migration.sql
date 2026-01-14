-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `image` TEXT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'GUARD', 'RESIDENT') NOT NULL DEFAULT 'RESIDENT',
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complexes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `type` ENUM('BUILDING', 'RESIDENTIAL', 'CONDO') NOT NULL DEFAULT 'BUILDING',
    `logo_url` VARCHAR(191) NULL,
    `settings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `adminId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NULL,
    `bedrooms` INTEGER NOT NULL DEFAULT 1,
    `bathrooms` DOUBLE NOT NULL DEFAULT 1.0,
    `area` DOUBLE NULL,
    `status` ENUM('OCCUPIED', 'VACANT', 'MAINTENANCE') NOT NULL DEFAULT 'VACANT',
    `complex_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `units_complex_id_number_key`(`complex_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `residents` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('OWNER', 'TENANT') NOT NULL DEFAULT 'TENANT',
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `emergency_contact` JSON NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `unit_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `residents_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `amenities` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('POOL', 'GYM', 'CLUBHOUSE', 'COURT', 'BBQ', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `capacity` INTEGER NULL,
    `operating_hours` JSON NULL,
    `cost_per_day` DECIMAL(10, 2) NULL,
    `cost_per_hour` DECIMAL(10, 2) NULL,
    `complex_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complexes` ADD CONSTRAINT `complexes_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `residents` ADD CONSTRAINT `residents_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `residents` ADD CONSTRAINT `residents_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `amenities` ADD CONSTRAINT `amenities_complex_id_fkey` FOREIGN KEY (`complex_id`) REFERENCES `complexes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
