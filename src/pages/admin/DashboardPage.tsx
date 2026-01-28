import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Button, Loader } from '@/components/ui'
// import { useAuth } from '@/context/AuthContext'
import { requestGoogleToken, createGoogleEvent, loadGoogleScript } from '@/lib/google'

// Tipos locales para el dashboard
interface DashboardStats {
    todayBookings: number
    pendingBookings: number
    totalClients: number
}

interface NextBooking {
    id: string
    client_name: string
    service_name: string
    start_time: string
    status: string
}

export function DashboardPage() {
    // const { user } = useAuth()
    const [stats, setStats] = useState<DashboardStats>({
        todayBookings: 0,
        pendingBookings: 0,
        totalClients: 0
    })
    const [nextBookings, setNextBookings] = useState<NextBooking[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        loadData()
        loadGoogleScript() // Precargar script
    }, [])

    const handleSyncGoogle = async () => {
        try {
            setSyncing(true)

            // 1. Obtener email conectado para usarlo como hint
            const { data: settingsData } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'google_calendar_connected_email')
                .single()

            const connectedEmail = (settingsData as any)?.value || undefined

            // 2. Obtener token (con hint del email guardado)
            sessionStorage.removeItem('google_access_token')
            const token = await requestGoogleToken(connectedEmail)
            sessionStorage.setItem('google_access_token', token)

            // 2. Buscar reservas sin sincronizar
            const { data: pendingBookings, error: queryError } = await supabase
                .from('bookings')
                .select('*, profiles(full_name), services(name, duration_minutes)')
                .is('google_event_id', null)
                .neq('status', 'cancelada')

            console.log('Reservas encontradas:', pendingBookings?.length, queryError)

            if (!pendingBookings || pendingBookings.length === 0) {
                alert('No hay reservas pendientes de sincronizar.')
                return
            }

            let syncedCount = 0

            // 3. Crear eventos
            for (const booking of (pendingBookings as any[])) {
                // Cast seguro para TS
                const serviceName = (booking.services as any)?.name || 'Servicio'
                const clientName = (booking.profiles as any)?.full_name || 'Cliente'

                // Formatear tiempos correctamente (quitar segundos si tienen más de HH:MM)
                const startTime = String(booking.start_time).substring(0, 5) // HH:MM
                const endTime = String(booking.end_time).substring(0, 5)

                const event = {
                    summary: `Cita: ${serviceName} - ${clientName}`,
                    description: `Cliente: ${clientName}\nServicio: ${serviceName}`,
                    start: {
                        dateTime: `${booking.booking_date}T${startTime}:00`,
                        timeZone: 'Europe/Madrid'
                    },
                    end: {
                        dateTime: `${booking.booking_date}T${endTime}:00`,
                        timeZone: 'Europe/Madrid'
                    }
                }

                console.log('Enviando evento:', JSON.stringify(event, null, 2))

                try {
                    const googleEvent = await createGoogleEvent(token, event)

                    // 4. Actualizar reserva con ID
                    await (supabase
                        .from('bookings') as any)
                        .update({ google_event_id: googleEvent.id } as any)
                        .eq('id', booking.id)

                    syncedCount++
                } catch (err: any) {
                    console.error('Error syncing booking:', booking.id, err?.message || err)
                }
            }

            alert(`Sincronizadas ${syncedCount} reservas con Google Calendar.`)
            loadData()

        } catch (error) {
            console.error('Sync error:', error)
            sessionStorage.removeItem('google_access_token')
            alert('Error en la sincronización. Verifica tu conexión en Ajustes.')
        } finally {
            setSyncing(false)
        }
    }

    const loadData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]

            // 1. Citas de hoy
            const { count: todayCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('booking_date', today)
                .neq('status', 'cancelada')

            // 2. Citas pendientes
            const { count: pendingCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pendiente')

            // 3. Clientes totales
            const { count: clientsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'cliente')

            // 4. Próximas citas
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select(`
                    id,
                    start_time,
                    status,
                    profiles:client_id (full_name),
                    services:service_id (name)
                `)
                .gte('booking_date', today)
                .order('booking_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5)

            setStats({
                todayBookings: todayCount || 0,
                pendingBookings: pendingCount || 0,
                totalClients: clientsCount || 0
            })

            // Mapear datos complejos
            const mappedBookings = bookingsData ? bookingsData.map((b: any) => ({
                id: b.id,
                client_name: b.profiles?.full_name || 'Desconocido',
                service_name: b.services?.name || 'Servicio',
                start_time: b.start_time.substring(0, 5),
                status: b.status
            })) : []

            setNextBookings(mappedBookings)

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loader />

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem' }}>Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Button onClick={handleSyncGoogle} isLoading={syncing} variant="secondary">
                        ☁️ Sincronizar Calendar
                    </Button>
                    <span style={{ fontSize: '0.9rem', color: 'gray' }}>{new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <Card>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Citas Hoy</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        {stats.todayBookings}
                    </div>
                </Card>

                <Card>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Pendientes</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--color-warning)' }}>
                        {stats.pendingBookings}
                    </div>
                </Card>

                <Card>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Total Clientes</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        {stats.totalClients}
                    </div>
                </Card>
            </div>

            {/* Próximas Citas */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Próximas Citas</h3>
                    <Link to="/admin/calendar">
                        <Button variant="ghost" size="sm">Ver Calendario</Button>
                    </Link>
                </div>

                {nextBookings.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                        No hay citas próximas programadas.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {nextBookings.map((booking) => (
                            <div
                                key={booking.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--color-bg-secondary)'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{booking.start_time} - {booking.client_name}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        {booking.service_name}
                                    </div>
                                </div>
                                <div>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        backgroundColor: booking.status === 'confirmada' ? 'var(--color-success)' : 'var(--color-warning)',
                                        color: 'white'
                                    }}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
