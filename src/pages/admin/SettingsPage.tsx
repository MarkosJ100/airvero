import { useState, useEffect } from 'react'
import { Card, Button } from '@/components/ui'
import { loadGoogleScript, requestGoogleToken } from '@/lib/google'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'

export function SettingsPage() {
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [connected, setConnected] = useState(false)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)

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
        if (settingsData?.value) {
            setConnected(true)
            setConnectedEmail(settingsData.value)
        }
    }

    const handleConnect = async () => {
        setLoading(true)
        try {
            await loadGoogleScript()
            const token = await requestGoogleToken()

            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json())

            const { error } = await (supabase.from('app_settings') as any)
                .upsert({
                    key: 'google_calendar_connected_email',
                    value: userInfo.email
                }, { onConflict: 'key' })

            if (error) throw error

            setConnected(true)
            setConnectedEmail(userInfo.email)
            sessionStorage.setItem('google_access_token', token)
            toast.success(`Conectado como ${userInfo.email}`)

        } catch (error) {
            console.error('Error conectando:', error)
            toast.error('No se pudo conectar con Google')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        await supabase.from('app_settings').delete().eq('key', 'google_calendar_connected_email')
        sessionStorage.removeItem('google_access_token')
        setConnected(false)
        setConnectedEmail(null)
        toast.success('Desconectado de Google Calendar')
    }

    return (
        <div style={{ maxWidth: '800px', paddingBottom: '3rem' }}>
            {/* Header */}
            <div className="page-header">
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>⚙️ Configuración</h2>
            </div>

            {/* Google Calendar Card */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>
                            📅 Google Calendar
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            Sincroniza tus reservas con tu calendario de Google.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {connected ? (
                            <>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        ● Conectado
                                    </div>
                                    {connectedEmail && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            {connectedEmail}
                                        </div>
                                    )}
                                </div>
                                <Button variant="danger" size="sm" onClick={handleDisconnect} isLoading={loading}>
                                    Desconectar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleConnect} isLoading={loading}>
                                Conectar Cuenta
                            </Button>
                        )}
                    </div>
                </div>

                {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ Falta configurar <code style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '0.1rem 0.25rem', borderRadius: '3px' }}>VITE_GOOGLE_CLIENT_ID</code> en el archivo .env
                    </div>
                )}
            </Card>

            {/* Version Info */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>
                            📱 Información de la App
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                            AIRVERO • Versión 2.0.0
                        </p>
                    </div>
                    <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                        fontWeight: 600
                    }}>
                        Mobile Ready
                    </div>
                </div>
            </Card>
        </div>
    )
}
