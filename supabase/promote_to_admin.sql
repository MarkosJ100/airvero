-- ====================================================
-- SCRIPT PARA PROMOVER USUARIO A ADMIN
-- ====================================================
-- Instrucciones:
-- 1. Regístrate en la aplicación (/register) si no lo has hecho.
-- 2. Copia este código en el Editor SQL de Supabase.
-- 3. Reemplaza 'tu_email@ejemplo.com' por tu correo real.
-- 4. Ejecuta el script.

UPDATE public.profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'pruebaspubli100@gmail.com' -- <--- Pon tu email aquí
  LIMIT 1
);

-- Verificación (Opcional):
-- SELECT * FROM public.profiles WHERE role = 'admin';
