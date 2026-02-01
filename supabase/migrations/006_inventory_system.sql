-- =============================================
-- AIRVERO - Sistema de Inventario
-- Gestión de productos de peluquería
-- =============================================

-- =============================================
-- TABLA: productos
-- =============================================

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    marca TEXT,
    descripcion TEXT,
    codigo_barras TEXT UNIQUE,
    precio_compra DECIMAL(10, 2),
    precio_venta DECIMAL(10, 2),
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    stock_maximo INT,
    unidad_medida TEXT DEFAULT 'unidad',
    ubicacion TEXT,
    proveedor TEXT,
    notas TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_is_active ON productos(is_active);
CREATE INDEX idx_productos_stock_bajo ON productos(stock_actual) WHERE stock_actual <= stock_minimo;

COMMENT ON TABLE productos IS 'Inventario de productos de peluquería';
COMMENT ON COLUMN productos.stock_minimo IS 'Cantidad mínima para alerta de stock bajo';
COMMENT ON COLUMN productos.unidad_medida IS 'unidad, ml, gr, etc.';

-- =============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =============================================

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS: Solo admin puede gestionar productos
-- =============================================

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all productos"
    ON productos FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- =============================================
-- VERIFICACIÓN
-- =============================================

SELECT 'Migración de inventario completada' as status;
