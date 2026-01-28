-- =============================================
-- AIRVERO v2.0 — Actualización de Políticas RLS
-- Simplificar a solo acceso admin
-- =============================================

-- Ya no necesitamos políticas para clientes
-- Solo admin accede a todas las tablas

-- =============================================
-- ACTUALIZAR: bookings policies
-- =============================================

-- Eliminar políticas antiguas de clientes
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can cancel own bookings" ON bookings;

-- Las políticas de admin ya existen y son suficientes:
-- "Admin can view all bookings"
-- "Admin can create any booking"
-- "Admin can update all bookings"
-- "Admin can delete bookings"

-- =============================================
-- ACTUALIZAR: services policies
-- =============================================

-- Eliminar política de ver servicios activos para anónimos
DROP POLICY IF EXISTS "Anyone can view active services" ON services;

-- Las políticas de admin ya cubren todo:
-- "Admin can view all services"
-- "Admin can insert services"
-- "Admin can update services"
-- "Admin can delete services"

-- =============================================
-- ACTUALIZAR: schedules policies
-- =============================================

-- Eliminar vista pública de horarios
DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;

-- Políticas de admin ya existen:
-- "Admin can insert schedules"
-- "Admin can update schedules"
-- "Admin can delete schedules"

-- =============================================
-- ACTUALIZAR: salon_config policies
-- =============================================

-- Eliminar vista pública de configuración
DROP POLICY IF EXISTS "Anyone can view salon config" ON salon_config;

-- Políticas de admin ya existen:
-- "Admin can update salon config"
-- "Admin can insert salon config"

-- =============================================
-- COMENTARIOS FINALES
-- =============================================

COMMENT ON TABLE bookings IS 'Reservas (v2.0 - solo admin gestiona)';
COMMENT ON TABLE clientes IS 'Agenda de contactos interna (v2.0 - no auth)';

-- Resultado: Todas las tablas principales ahora solo son accesibles por admin
-- RLS sigue activo para seguridad, pero políticas simplificadas
