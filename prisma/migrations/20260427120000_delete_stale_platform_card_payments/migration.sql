-- Pagos PENDIENTES con tarjeta sin checkout o abandonados (>30 días). Misma regla que tenía el botón de limpieza.
DELETE FROM `platform_fee_payments`
WHERE `status` = 'PENDING'
  AND `payment_method` = 'CARD'
  AND (`recurrente_checkout_id` IS NULL OR `created_at` < DATE_SUB(NOW(), INTERVAL 30 DAY));
