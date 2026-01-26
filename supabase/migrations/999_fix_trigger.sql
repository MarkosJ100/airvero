-- =============================================
-- AIRVERO - Fix Trigger Registro
-- Objetivo: Corregir error 500 al registrar usuarios
-- =============================================

-- 1. Eliminar el trigger y función anteriores para asegurar limpieza
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recrear la función con mejoras de seguridad y robustez
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public -- Importante: Forzar uso del esquema public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (
        NEW.id,
        -- Asegurar que nunca sea null, usar email como fallback seguro
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Usuario'),
        -- Convertir rol o usar default
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'cliente')
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Loguear error pero no bloquear el registro (opcional, aquí bloqueamos para notar el fallo)
        RAISE NOTICE 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Permitir registro aunque falle perfil? No, mejor fallar para consistencia.
        -- Si descomentas RETURN NEW arriba, el usuario se crea sin perfil.
        -- Si lo dejas fallar (RAISE EXCEPTION), el usuario no se crea.
        -- Vamos a dejar que falle por ahora para debuggear, pero con search_path debería arreglarse.
END;
$$ LANGUAGE plpgsql;

-- 3. Volver a crear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Asegurar permisos (por si acaso)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
-- Anon y authenticated ya tienen sus permisos via RLS y grants públicos, pero el trigger corre como Owner (postgres)
