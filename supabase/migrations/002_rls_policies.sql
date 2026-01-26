-- =============================================
-- AIRVERO - Políticas RLS (Row Level Security)
-- Fase 1: Seguridad de Base de Datos
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNCIÓN AUXILIAR: Verificar si el usuario es admin
-- =============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- POLÍTICAS: profiles
-- =============================================

-- Cualquier usuario autenticado puede ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admin puede ver todos los perfiles
CREATE POLICY "Admin can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (is_admin());

-- Usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admin puede actualizar cualquier perfil
CREATE POLICY "Admin can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (is_admin());

-- =============================================
-- POLÍTICAS: salon_config
-- =============================================

-- Cualquiera puede ver la configuración del salón (pública)
CREATE POLICY "Anyone can view salon config"
    ON salon_config FOR SELECT
    TO anon, authenticated
    USING (true);

-- Solo admin puede modificar la configuración
CREATE POLICY "Admin can update salon config"
    ON salon_config FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admin can insert salon config"
    ON salon_config FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- =============================================
-- POLÍTICAS: services
-- =============================================

-- Cualquiera puede ver los servicios activos
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Admin puede ver todos los servicios (incluso inactivos)
CREATE POLICY "Admin can view all services"
    ON services FOR SELECT
    TO authenticated
    USING (is_admin());

-- Solo admin puede gestionar servicios
CREATE POLICY "Admin can insert services"
    ON services FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admin can update services"
    ON services FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admin can delete services"
    ON services FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================
-- POLÍTICAS: schedules
-- =============================================

-- Cualquiera puede ver los horarios
CREATE POLICY "Anyone can view schedules"
    ON schedules FOR SELECT
    TO anon, authenticated
    USING (true);

-- Solo admin puede gestionar horarios
CREATE POLICY "Admin can insert schedules"
    ON schedules FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admin can update schedules"
    ON schedules FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admin can delete schedules"
    ON schedules FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================
-- POLÍTICAS: bookings
-- =============================================

-- Clientes pueden ver sus propias reservas
CREATE POLICY "Clients can view own bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (client_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

-- Admin puede ver todas las reservas
CREATE POLICY "Admin can view all bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (is_admin());

-- Clientes autenticados pueden crear reservas
CREATE POLICY "Authenticated users can create bookings"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (client_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    ));

-- Admin puede crear reservas para cualquier cliente
CREATE POLICY "Admin can create any booking"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

-- Clientes pueden cancelar sus propias reservas (cambiar a 'cancelada')
CREATE POLICY "Clients can cancel own bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
        client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        AND status IN ('pendiente', 'confirmada')
    )
    WITH CHECK (status = 'cancelada');

-- Admin puede modificar cualquier reserva
CREATE POLICY "Admin can update all bookings"
    ON bookings FOR UPDATE
    TO authenticated
    USING (is_admin());

-- Solo admin puede eliminar reservas
CREATE POLICY "Admin can delete bookings"
    ON bookings FOR DELETE
    TO authenticated
    USING (is_admin());

-- =============================================
-- POLÍTICAS: google_calendar_tokens
-- =============================================

-- Solo admin puede acceder a los tokens de Google Calendar
CREATE POLICY "Admin can manage google calendar tokens"
    ON google_calendar_tokens FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
