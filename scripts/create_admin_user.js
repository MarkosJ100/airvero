
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://valbywilixexmhbnssye.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lfq3VVRrJMeK6J6inezI_w_NPWE5by5'; // Hardcoded

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdmin() {
    console.log('Creando usuario...');

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
        email: 'airveroyusdo@gmail.com',
        password: '123456'
    });

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!data.user) {
        console.log('⚠️ Usuario creado pero requiere confirmación de email (probablemente). Revisa tu correo.');
        console.log('ID del usuario:', data.user?.id);
    } else {
        console.log('✅ Usuario creado:', data.user.id);
        console.log('\n--- SQL PARA EJECUTAR EN SUPABASE DASHBOARD ---');
        console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${data.user.id}';`);
    }
}

createAdmin();
