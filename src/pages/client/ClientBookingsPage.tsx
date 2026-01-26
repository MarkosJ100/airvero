import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, Loader, Button } from '@/components/ui'
import { Booking } from '@/types/database.types'

// Tipo extendido para incluir relaciones
interface BookingWithRelations extends Booking {
    services: { name: string; price: number }
}

export function ClientBookingsPage() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState<BookingWithRelations[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchBookings()
    }, [user])

    const fetchBookings = async () => {
        try {
            // Obtener ID del perfil primero
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user!.id)
                .single()

            if (error && error.code !== 'PGRST116') console.error(error)

            // Cast explicito para evitar 'never'
            const profileData = profile as { id: string } | null
            if (!profileData) return

            const { data } = await supabase
                .from('bookings')
                .select('*, services(name, price)')
                .eq('client_id', profileData.id)
                .order('booking_date', { ascending: false })

            if (data) setBookings(data as any)
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('¿Seguro que quieres cancelar esta reserva?')) return

        await (supabase.from('bookings') as any).update({ status: 'cancelada' }).eq('id', id)
        fetchBookings() // Recargar
    }

    if (loading) return <Loader />

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Mis Reservas</h2>

            {bookings.length === 0 ? (
                <p>No tienes reservas aún.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {bookings.map(booking => (
                        <Card key={booking.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                        {booking.services.name}
                                    </h3>
                                    <div style={{ color: 'gray', fontSize: '0.9rem' }}>
                                        {booking.booking_date} a las {booking.start_time.substring(0, 5)}
                                    </div>
                                </div>

                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    backgroundColor: booking.status === 'confirmada' ? 'var(--color-success)' :
                                        booking.status === 'cancelada' ? 'var(--color-error)' : 'var(--color-warning)',
                                    color: 'white'
                                }}>
                                    {booking.status}
                                </span>
                            </div>

                            {['pendiente', 'confirmada'].includes(booking.status) && (
                                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                    <Button variant="danger" size="sm" onClick={() => handleCancel(booking.id)}>
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
