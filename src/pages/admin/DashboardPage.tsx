import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Button, StatCardSkeleton } from '@/components/ui'

// Tipos locales para el dashboard
interface DashboardStats {
    todayBookings: number
    pendingBookings: number
    confirmedBookings: number
    totalClientes: number
}

interface NextBooking {
    id: string
    client_name: string
    service_name: string
    booking_date: string
    start_time: string
    status: string
}

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        todayBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        totalClientes: 0
    })
    const [nextBookings, setNextBookings] = useState<NextBooking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

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

            // 3. Citas confirmadas
            const { count: confirmedCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmada')

            // 4. Total de clientes (v2.0 - tabla clientes)
            const { count: clientesCount } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })

            // 5. Próximas citas
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select(`
                    id,
                    booking_date,
                    start_time,
                    status,
                    clientes:cliente_id (nombre),
                    services:service_id (name)
                `)
                .gte('booking_date', today)
                .order('booking_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(5)

            setStats({
                todayBookings: todayCount || 0,
                pendingBookings: pendingCount || 0,
                confirmedBookings: confirmedCount || 0,
                totalClientes: clientesCount || 0
            })

            // Mapear datos
            const mappedBookings = bookingsData ? bookingsData.map((b: any) => ({
                id: b.id,
                booking_date: b.booking_date,
                client_name: b.clientes?.nombre || 'Cliente',
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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem' }}>📊 Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/admin/bookings">
                        <Button variant="primary">+ Nueva Reserva</Button>
                    </Link>
                    <span style={{ fontSize: '0.9rem', color: 'gray' }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
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
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Confirmadas</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--color-success)' }}>
                                {stats.confirmedBookings}
                            </div>
                        </Card>

                        <Card>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Total Clientes</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                                {stats.totalClientes}
                            </div>
                        </Card>
                    </>
                )}
            </div>

            {/* Próximas Citas */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>Próximas Citas</h3>
                    <Link to="/admin/calendar">
                        <Button variant="ghost" size="sm">Ver Agenda</Button>
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
                                    <div style={{ fontWeight: 600 }}>{formatDate(booking.booking_date)} - {booking.start_time}</div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        {booking.client_name} • {booking.service_name}
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
