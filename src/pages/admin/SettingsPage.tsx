import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { loadGoogleScript, requestGoogleToken } from '@/lib/google'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [connected, setConnected] = useState(false)

    // En este prototipo, "conectado" significa que tenemos el email del admin guardado en settings
    // En prod, guardaríamos un refresh_token encriptado en el backend/edge function

    useEffect(() => {
        checkConnection()
    }, [])

    const checkConnection = async () => {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'google_calendar_connected_email')
            .single()

        const settingsData = data as { value: string } | null
        if (settingsData?.value) setConnected(true)
    }

    const handleConnect = async () => {
        setLoading(true)
        try {
            await loadGoogleScript()
            const token = await requestGoogleToken()

            // Obtener info del usuario para confirmar conexión
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())

            // Guardar email conectado como indicador (no guardamos el access_token persistente aquí por ser efímero)
            // El admin tendrá que re-autenticarse para sincronizar si expira la sesión (común en client-side integration)
            const { error } = await (supabase.from('app_settings') as any)
                .upsert({
                    key: 'google_calendar_connected_email',
                    value: userInfo.email
                }, { onConflict: 'key' })

            if (error) throw error

            setConnected(true)
            alert(`Conectado exitosamente como: ${userInfo.email}`)

            // Guardar token temporal en sessionStorage para uso inmediato
            sessionStorage.setItem('google_access_token', token)

        } catch (error) {
            console.error('Error conectando:', error)
            alert('No se pudo conectar con Google. Verifica tu configuración.')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        await supabase.from('app_settings').delete().eq('key', 'google_calendar_connected_email')
        sessionStorage.removeItem('google_access_token')
        setConnected(false)
    }

    return (
        <div style={{ maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '2rem' }}>Configuración</h2>

            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Google Calendar</h3>
                        <p style={{ color: 'gray', fontSize: '0.9rem' }}>
                            Sincroniza tus reservas automáticamente con tu calendario.
                        </p>
                    </div>

                    <div>
                        {connected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'green', fontWeight: 500 }}>● Conectado</span>
                                <Button variant="danger" size="sm" onClick={handleDisconnect} isLoading={loading}>
                                    Desconectar
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleConnect} isLoading={loading}>
                                Conectar Cuenta
                            </Button>
                        )}
                    </div>
                </div>

                {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                        ⚠️ Falta configurar <code>VITE_GOOGLE_CLIENT_ID</code> en el archivo .env
                    </div>
                )}
            </Card>
        </div>
    )
}
