-- =============================================
-- AIRVERO v2.0 — MIGRACIONES COMPLETAS
-- Ejecutar TODO este archivo en Supabase SQL Editor
-- =============================================

-- =============================================
-- MIGRACIÓN 1: Tabla clientes
-- =============================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

COMMENT ON TABLE clientes IS 'Agenda de contactos interna (v2.0 - no auth)';

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all clientes"
    ON clientes FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- MIGRACIÓN 2: Extender bookings
-- =============================================

ALTER TABLE bookings ADD COLUMN client_id_backup UUID;
UPDATE bookings SET client_id_backup = client_id;
COMMENT ON COLUMN bookings.client_id_backup IS 'Backup temporal para rollback seguro';

ALTER TABLE bookings ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX idx_bookings_cliente ON bookings(cliente_id);
COMMENT ON COLUMN bookings.cliente_id IS 'FK a clientes (v2.0 - contactos internos)';

-- =============================================
-- MIGRACIÓN 3: RLS Admin-Only
-- =============================================

DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;
DROP POLICY IF EXISTS "Anyone can view salon config" ON salon_config;

COMMENT ON TABLE bookings IS 'Reservas (v2.0 - solo admin gestiona)';
COMMENT ON TABLE clientes IS 'Agenda de contactos interna (v2.0 - no auth)';

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT 'Migración completada exitosamente' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes';
