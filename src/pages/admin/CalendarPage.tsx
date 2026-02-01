import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Loader } from '@/components/ui'

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
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        return new Date(today.setDate(diff))
    })
    const [bookings, setBookings] = useState<CalendarBooking[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDayIndex, setSelectedDayIndex] = useState(0)

    useEffect(() => {
        // Set selected day to today if it's in the current week
        const today = new Date()
        const todayDayOfWeek = today.getDay()
        const adjustedIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1
        setSelectedDayIndex(adjustedIndex)
    }, [])

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

    const dayNamesShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    const dayNamesFull = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const weekDays = getWeekDays()

    if (loading) return <Loader />

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <div className="page-header">
                <h2 style={{ margin: 0 }}>📅 Calendario</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button variant="secondary" size="sm" onClick={() => navigateWeek(-1)}>←</Button>
                    <span style={{ fontWeight: 600, minWidth: '120px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {formatWeekRange()}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigateWeek(1)}>→</Button>
                </div>
            </div>

            {/* MOBILE: Day Tabs */}
            <div className="calendar-mobile-view">
                <div className="calendar-day-tabs">
                    {weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === new Date().toDateString()
                        const dayBookings = getBookingsForDay(day)
                        return (
                            <button
                                key={idx}
                                className={`calendar-day-tab ${selectedDayIndex === idx ? 'active' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => setSelectedDayIndex(idx)}
                            >
                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{dayNamesShort[idx]}</span>
                                <span style={{ fontWeight: 600 }}>{day.getDate()}</span>
                                {dayBookings.length > 0 && (
                                    <span style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: selectedDayIndex === idx ? 'white' : 'var(--color-primary)',
                                        marginTop: '0.25rem'
                                    }} />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Selected Day Bookings */}
                <Card>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>
                        {weekDays[selectedDayIndex]?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    {(() => {
                        const dayBookings = getBookingsForDay(weekDays[selectedDayIndex])
                        if (dayBookings.length === 0) {
                            return <p className="empty-state" style={{ padding: '2rem 0' }}>Sin citas este día</p>
                        }
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {dayBookings.map(booking => (
                                    <div
                                        key={booking.id}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            backgroundColor: getStatusColor(booking.status),
                                            color: 'white'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600 }}>{booking.start_time} - {booking.end_time}</div>
                                        <div style={{ opacity: 0.9 }}>{booking.client_name}</div>
                                        <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>{booking.service_name}</div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </Card>
            </div>

            {/* DESKTOP: Week Grid */}
            <div className="calendar-week-grid" style={{ minHeight: '500px' }}>
                {weekDays.map((day, idx) => {
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
                            {/* Day Header */}
                            <div style={{
                                padding: '0.75rem',
                                borderBottom: '1px solid var(--color-border)',
                                textAlign: 'center',
                                backgroundColor: isToday ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                color: isToday ? 'white' : 'inherit'
                            }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{dayNamesFull[idx]}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{day.getDate()}</div>
                            </div>

                            {/* Bookings */}
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

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
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
            </div>
        </div>
    )
}
