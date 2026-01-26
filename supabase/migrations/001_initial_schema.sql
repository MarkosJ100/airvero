-- =============================================
-- AIRVERO - Migración Inicial
-- Fase 1: Esquema de Base de Datos
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

-- Rol de usuario
CREATE TYPE user_role AS ENUM ('admin', 'cliente');

-- Estado de reserva
CREATE TYPE booking_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');

-- =============================================
-- TABLA: profiles
-- Extiende auth.users con datos adicionales
-- =============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas por user_id
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Índice para filtrar por rol
CREATE INDEX idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'Perfiles de usuario extendiendo auth.users';
COMMENT ON COLUMN profiles.role IS 'admin = peluquero/dueño, cliente = cliente del negocio';

-- =============================================
-- TABLA: salon_config
-- Configuración única de la peluquería
-- =============================================

CREATE TABLE salon_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    default_duration_minutes INT NOT NULL DEFAULT 30,
    booking_advance_days INT NOT NULL DEFAULT 30,
    cancellation_hours INT NOT NULL DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE salon_config IS 'Configuración única del negocio (solo 1 registro)';
COMMENT ON COLUMN salon_config.default_duration_minutes IS 'Duración por defecto de servicios en minutos';
COMMENT ON COLUMN salon_config.booking_advance_days IS 'Días máximos de antelación para reservar';
COMMENT ON COLUMN salon_config.cancellation_hours IS 'Horas mínimas para cancelar sin penalización';

-- =============================================
-- TABLA: services
-- Servicios ofrecidos por la peluquería
-- =============================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para listar servicios activos ordenados
CREATE INDEX idx_services_active_order ON services(is_active, sort_order);

COMMENT ON TABLE services IS 'Servicios ofrecidos por la peluquería';
COMMENT ON COLUMN services.price IS 'Precio informativo (no hay pagos en la app)';

-- =============================================
-- TABLA: schedules
-- Horarios de disponibilidad por día
-- =============================================

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un solo horario por día
    CONSTRAINT unique_day_schedule UNIQUE (day_of_week),
    -- La hora de fin debe ser posterior a la de inicio
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE schedules IS 'Horarios de disponibilidad semanal';
COMMENT ON COLUMN schedules.day_of_week IS '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado';

-- =============================================
-- TABLA: bookings
-- Reservas de clientes
-- =============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'pendiente',
    notes TEXT,
    gcal_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- La hora de fin debe ser posterior a la de inicio
    CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Índice para buscar reservas por fecha
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Índice para buscar reservas de un cliente
CREATE INDEX idx_bookings_client ON bookings(client_id);

-- Índice para filtrar por estado
CREATE INDEX idx_bookings_status ON bookings(status);

-- Índice compuesto para verificar solapamientos
CREATE INDEX idx_bookings_date_time ON bookings(booking_date, start_time, end_time);

COMMENT ON TABLE bookings IS 'Reservas de citas';
COMMENT ON COLUMN bookings.gcal_event_id IS 'ID del evento en Google Calendar (para sincronización)';

-- =============================================
-- TABLA: google_calendar_tokens
-- Tokens OAuth para Google Calendar
-- =============================================

CREATE TABLE google_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    calendar_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE google_calendar_tokens IS 'Tokens de integración con Google Calendar (solo admin)';

-- =============================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salon_config_updated_at
    BEFORE UPDATE ON salon_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_tokens_updated_at
    BEFORE UPDATE ON google_calendar_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cliente')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
