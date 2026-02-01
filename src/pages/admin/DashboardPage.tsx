import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Button, StatCardSkeleton } from '@/components/ui'

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

            const { count: todayCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('booking_date', today)
                .neq('status', 'cancelada')

            const { count: pendingCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pendiente')

            const { count: confirmedCount } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmada')

            const { count: clientesCount } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })

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

    const todayFormatted = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    })

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.8rem', margin: 0 }}>📊 Dashboard</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0' }}>
                        {todayFormatted}
                    </p>
                </div>
                <div className="desktop-only">
                    <Link to="/admin/bookings">
                        <Button variant="primary">+ Nueva Reserva</Button>
                    </Link>
                </div>
            </div>

            {/* FAB Mobile */}
            <Link to="/admin/bookings" className="fab mobile-only">
                ➕
            </Link>

            {/* Stats Grid */}
            <div className="stats-grid">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="stat-card">
                            <div className="stat-label">📅 Citas Hoy</div>
                            <div className="stat-value">{stats.todayBookings}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">⏳ Pendientes</div>
                            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>
                                {stats.pendingBookings}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">✅ Confirmadas</div>
                            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                                {stats.confirmedBookings}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">👥 Clientes</div>
                            <div className="stat-value">{stats.totalClientes}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Próximas Citas */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Próximas Citas</h3>
                    <Link to="/admin/calendar">
                        <Button variant="ghost" size="sm">Ver Agenda</Button>
                    </Link>
                </div>

                {nextBookings.length === 0 ? (
                    <p className="empty-state">No hay citas próximas programadas.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {nextBookings.map((booking) => (
                            <div
                                key={booking.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--color-bg-secondary)'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                        {formatDate(booking.booking_date)} • {booking.start_time}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {booking.client_name} — {booking.service_name}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    backgroundColor: booking.status === 'confirmada' ? 'var(--color-success)' : 'var(--color-warning)',
                                    color: 'white'
                                }}>
                                    {booking.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
