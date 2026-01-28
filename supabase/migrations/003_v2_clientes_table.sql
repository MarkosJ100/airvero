-- =============================================
-- AIRVERO v2.0 — Migración Paso 1
-- Crear tabla clientes (contactos internos)
-- COMMIT 1: Base de datos (NO rompe nada)
-- =============================================

-- =============================================
-- TABLA: clientes
-- Contactos internos (NO son usuarios auth)
-- =============================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_clientes_nombre ON clientes(nombre);

-- Índice para búsquedas por teléfono
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

COMMENT ON TABLE clientes IS 'Agenda de contactos interna (v2.0 - no auth)';

-- =============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =============================================

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS: Solo admin puede gestionar clientes
-- =============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Admin puede hacer todo con clientes
CREATE POLICY "Admin can manage all clientes"
    ON clientes FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
