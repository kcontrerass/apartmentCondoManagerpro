-- Comprobantes de plataforma sin unidad: primero permitir NULL, luego limpiar filas de plataforma.
ALTER TABLE `invoices` MODIFY `unit_id` VARCHAR(191) NULL;

UPDATE `invoices` SET `unit_id` = NULL WHERE `category` = 'PLATFORM_SUBSCRIPTION';
