-- DropForeignKey
ALTER TABLE `residents` DROP FOREIGN KEY `residents_unit_id_fkey`;

-- AddForeignKey
ALTER TABLE `residents` ADD CONSTRAINT `residents_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
