import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase no configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env'
    )
}

/**
 * Cliente de Supabase
 * 
 * Proporciona acceso a:
 * - Base de datos PostgreSQL
 * - Autenticación (Supabase Auth)
 * - Realtime subscriptions
 */
export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
)
