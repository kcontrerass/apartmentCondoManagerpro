-- Días de mora permitidos tras vencer la vigencia de suscripción a la plataforma
ALTER TABLE `platform_recurrente_settings` ADD COLUMN `subscription_grace_days` INTEGER NULL;
