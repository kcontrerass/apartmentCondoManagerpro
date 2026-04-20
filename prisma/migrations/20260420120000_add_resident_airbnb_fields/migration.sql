-- AlterTable
ALTER TABLE `residents` ADD COLUMN `is_airbnb` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `residents` ADD COLUMN `airbnb_start_date` DATETIME(3) NULL;
ALTER TABLE `residents` ADD COLUMN `airbnb_end_date` DATETIME(3) NULL;
ALTER TABLE `residents` ADD COLUMN `airbnb_guest_name` VARCHAR(191) NULL;
ALTER TABLE `residents` ADD COLUMN `airbnb_reservation_code` VARCHAR(191) NULL;
ALTER TABLE `residents` ADD COLUMN `airbnb_guest_phone` VARCHAR(191) NULL;
