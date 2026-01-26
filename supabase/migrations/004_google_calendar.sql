-- =============================================
-- AIRVERO - Fase 3: Integración Google Calendar
-- =============================================

-- Añadir columna para guardar el ID del evento de Google
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS google_event_id text;

-- Tabla para guardar configuración del calendario (token del admin, calendar_id preferido, etc)
-- Nota: En un entorno prod, los tokens OAuth deben guardarse encriptados o en vault.
-- Para este prototipo client-side, guardaremos solo preferencias no sensibles.
-- El token de sesión se manejará en memoria/localStorage del admin temporalmente.
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value text,
    updated_at timestamptz DEFAULT now()
);

-- Políticas RLS para app_settings (Solo admin puede gestionar)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin puede gestionar settings" ON public.app_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
    );
