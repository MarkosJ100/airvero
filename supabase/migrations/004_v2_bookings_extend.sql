-- =============================================
-- AIRVERO v2.0 — Migración Paso 2-3
-- Extender bookings para v2 (sin romper v1)
-- COMMIT 2-3: Transición segura de bookings
-- =============================================

-- =============================================
-- PASO 1: Crear columna de backup (seguridad)
-- =============================================

-- Backup de client_id antes de cualquier cambio
ALTER TABLE bookings
ADD COLUMN client_id_backup UUID;

-- Copiar valores actuales a backup
UPDATE bookings
SET client_id_backup = client_id;

COMMENT ON COLUMN bookings.client_id_backup IS 'Backup temporal para rollback seguro';

-- =============================================
-- PASO 2: Añadir nueva columna cliente_id
-- =============================================

-- Nueva FK a clientes (v2)
ALTER TABLE bookings
ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- Índice para búsquedas por cliente
CREATE INDEX idx_bookings_cliente ON bookings(cliente_id);

COMMENT ON COLUMN bookings.cliente_id IS 'FK a clientes (v2.0 - contactos internos)';

-- =============================================
-- NOTA IMPORTANTE
-- =============================================

-- En este punto:
-- - bookings.client_id sigue funcionando (v1 profiles)
-- - bookings.cliente_id está listo pero NULL (v2 clientes)
-- - bookings.client_id_backup es nuestro paracaídas
--
-- La app v1 sigue funcionando normalmente.
-- Siguiente paso: migrar datos cuando haya clientes en la tabla.
