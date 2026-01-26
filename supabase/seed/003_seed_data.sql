-- =============================================
-- AIRVERO - Datos de Prueba (Seed)
-- Fase 1: Datos Iniciales
-- =============================================

-- =============================================
-- Configuración del Salón
-- =============================================

INSERT INTO salon_config (
    name,
    description,
    address,
    phone,
    email,
    default_duration_minutes,
    booking_advance_days,
    cancellation_hours
) VALUES (
    'AIRVERO Peluquería',
    'Tu peluquería de confianza. Cuidamos de tu imagen con los mejores profesionales.',
    'Calle Principal 123, Madrid',
    '+34 600 123 456',
    'contacto@airvero.es',
    30,
    30,
    24
);

-- =============================================
-- Servicios
-- =============================================

INSERT INTO services (name, description, duration_minutes, price, is_active, sort_order) VALUES
    ('Corte de pelo', 'Corte clásico o moderno adaptado a tu estilo', 30, 15.00, true, 1),
    ('Lavado y peinado', 'Lavado con masaje capilar y peinado', 20, 10.00, true, 2),
    ('Corte + Lavado', 'Servicio completo de corte con lavado y peinado', 45, 22.00, true, 3),
    ('Tinte', 'Coloración profesional con productos de calidad', 60, 35.00, true, 4),
    ('Mechas', 'Mechas y reflejos personalizados', 90, 50.00, true, 5),
    ('Barba', 'Arreglo y perfilado de barba', 20, 8.00, true, 6),
    ('Corte + Barba', 'Combo corte de pelo y arreglo de barba', 45, 20.00, true, 7),
    ('Tratamiento capilar', 'Tratamiento hidratante y reparador', 30, 25.00, true, 8);

-- =============================================
-- Horarios (Lunes a Viernes 9:00-19:00, Sábado 9:00-14:00)
-- =============================================

INSERT INTO schedules (day_of_week, start_time, end_time, is_active) VALUES
    (1, '09:00', '19:00', true),   -- Lunes
    (2, '09:00', '19:00', true),   -- Martes
    (3, '09:00', '19:00', true),   -- Miércoles
    (4, '09:00', '19:00', true),   -- Jueves
    (5, '09:00', '19:00', true),   -- Viernes
    (6, '09:00', '14:00', true);   -- Sábado
-- Nota: Domingo no se inserta (cerrado). Si no hay registro = día no disponible.

-- =============================================
-- NOTA: Para crear el usuario admin
-- =============================================
-- El usuario admin se debe crear desde la UI de Supabase o 
-- mediante registro en la app. Después, ejecutar:
--
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE user_id = 'UUID_DEL_USUARIO';
--
-- O durante el registro, pasar metadata:
-- supabase.auth.signUp({
--   email: 'admin@airvero.es',
--   password: '...',
--   options: {
--     data: { full_name: 'Admin', role: 'admin' }
--   }
-- })
