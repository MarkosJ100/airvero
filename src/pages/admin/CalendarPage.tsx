import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Loader } from '@/components/ui'

interface CalendarBooking {
    id: string
    booking_date: string
    start_time: string
    end_time: string
    status: string
    client_name: string
    service_name: string
}

export function CalendarPage() {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Lunes
        return new Date(today.setDate(diff))
    })
    const [bookings, setBookings] = useState<CalendarBooking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBookings()
    }, [currentWeekStart])

    const fetchBookings = async () => {
        setLoading(true)
        const weekEnd = new Date(currentWeekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)

        const startStr = currentWeekStart.toISOString().split('T')[0]
        const endStr = weekEnd.toISOString().split('T')[0]

        const { data } = await supabase
            .from('bookings')
            .select(`
                id,
                booking_date,
                start_time,
                end_time,
                status,
                clientes:cliente_id (nombre),
                services:service_id (name)
            `)
            .gte('booking_date', startStr)
            .lte('booking_date', endStr)
            .order('start_time', { ascending: true })

        const mapped: CalendarBooking[] = (data || []).map((b: any) => ({
            id: b.id,
            booking_date: b.booking_date,
            start_time: b.start_time?.substring(0, 5) || '',
            end_time: b.end_time?.substring(0, 5) || '',
            status: b.status,
            client_name: b.clientes?.nombre || 'Cliente',
            service_name: b.services?.name || 'Servicio'
        }))

        setBookings(mapped)
        setLoading(false)
    }

    const navigateWeek = (direction: number) => {
        const newStart = new Date(currentWeekStart)
        newStart.setDate(newStart.getDate() + (direction * 7))
        setCurrentWeekStart(newStart)
    }

    const getWeekDays = () => {
        const days = []
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart)
            day.setDate(day.getDate() + i)
            days.push(day)
        }
        return days
    }

    const getBookingsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        return bookings.filter(b => b.booking_date === dateStr)
    }

    const formatWeekRange = () => {
        const end = new Date(currentWeekStart)
        end.setDate(end.getDate() + 6)
        const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
        return `${currentWeekStart.toLocaleDateString('es-ES', opts)} - ${end.toLocaleDateString('es-ES', opts)}`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmada': return 'var(--color-success)'
            case 'pendiente': return 'var(--color-warning)'
            case 'cancelada': return 'var(--color-error)'
            case 'completada': return 'var(--color-primary)'
            default: return 'gray'
        }
    }

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    if (loading) return <Loader />

    return (
        <div>
            {/* Header con navegación */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h2>Calendario</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigateWeek(-1)}>
                        ← Anterior
                    </Button>
                    <span style={{ fontWeight: 600, minWidth: '160px', textAlign: 'center' }}>
                        {formatWeekRange()}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigateWeek(1)}>
                        Siguiente →
                    </Button>
                </div>
            </div>

            {/* Grid del calendario */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                minHeight: '500px'
            }}>
                {getWeekDays().map((day, idx) => {
                    const dayBookings = getBookingsForDay(day)
                    const isToday = day.toDateString() === new Date().toDateString()

                    return (
                        <div
                            key={idx}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isToday ? 'var(--color-bg-secondary)' : 'transparent',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Cabecera del día */}
                            <div style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid var(--color-border)',
                                textAlign: 'center',
                                backgroundColor: isToday ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                color: isToday ? 'white' : 'inherit'
                            }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{dayNames[idx]}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{day.getDate()}</div>
                            </div>

                            {/* Citas del día */}
                            <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {dayBookings.length === 0 ? (
                                    <div style={{
                                        color: 'var(--color-text-secondary)',
                                        fontSize: '0.75rem',
                                        textAlign: 'center',
                                        padding: '1rem 0'
                                    }}>
                                        Sin citas
                                    </div>
                                ) : (
                                    dayBookings.map(booking => (
                                        <div
                                            key={booking.id}
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-sm)',
                                                backgroundColor: getStatusColor(booking.status),
                                                color: 'white',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{booking.start_time}</div>
                                            <div style={{ opacity: 0.9 }}>{booking.client_name}</div>
                                            <div style={{ opacity: 0.8, fontSize: '0.7rem' }}>{booking.service_name}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Leyenda */}
            <div style={{
                display: 'flex',
                gap: '1.5rem',
                marginTop: '1.5rem',
                justifyContent: 'center',
                fontSize: '0.85rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span>
                    Pendiente
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
                    Confirmada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                    Completada
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--color-error)' }}></span>
                    Cancelada
                </div>
            </div>
        </div>
    )
}
