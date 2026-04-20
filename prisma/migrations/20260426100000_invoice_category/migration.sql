-- MySQL: categoría de factura (cobros de unidad vs suscripción plataforma)
ALTER TABLE `invoices` ADD COLUMN `category` ENUM('UNIT_BILLING', 'PLATFORM_SUBSCRIPTION') NOT NULL DEFAULT 'UNIT_BILLING';

UPDATE `invoices` SET `category` = 'PLATFORM_SUBSCRIPTION' WHERE `number` LIKE 'INV-PLAT-%';

UPDATE `invoices` `i`
INNER JOIN `platform_fee_payments` `p` ON `p`.`invoice_id` = `i`.`id`
SET `i`.`category` = 'PLATFORM_SUBSCRIPTION'
WHERE `p`.`invoice_id` IS NOT NULL;
