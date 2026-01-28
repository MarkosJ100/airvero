import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Cliente, Service, BookingWithRelations } from '@/types/database.types'
import { generateWhatsAppLink, formatConfirmationMessage, formatDateSpanish, formatTime } from '@/lib/whatsapp'

export function BookingsPage() {
    const [bookings, setBookings] = useState<BookingWithRelations[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pendiente' | 'confirmada'>('all')

    const [formData, setFormData] = useState({
        cliente_id: '',
        service_id: '',
        booking_date: '',
        start_time: '',
        end_time: '',
        status: 'pendiente' as Booking['status'],
        notes: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [bookingsRes, clientesRes, servicesRes] = await Promise.all([
                supabase
                    .from('bookings')
                    .select(`
            *,
            clientes:cliente_id (*)
          `)
                    .order('booking_date', { ascending: false })
                    .order('start_time'),
                supabase.from('clientes').select('*').order('nombre'),
                supabase.from('services').select('*').eq('is_active', true).order('name')
            ])

            if (bookingsRes.error) throw bookingsRes.error
            if (clientesRes.error) throw clientesRes.error
            if (servicesRes.error) throw servicesRes.error

            setBookings(bookingsRes.data || [])
            setClientes(clientesRes.data || [])
            setServices(servicesRes.data || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            const { error } = await supabase
                .from('bookings')
                .insert({
                    cliente_id: formData.cliente_id,
                    service_id: formData.service_id,
                    booking_date: formData.booking_date,
                    start_time: formData.start_time,
                    end_time: formData.end_time,
                    status: formData.status,
                    notes: formData.notes || null
                })

            if (error) throw error

            setFormData({
                cliente_id: '',
                service_id: '',
                booking_date: '',
                start_time: '',
                end_time: '',
                status: 'pendiente',
                notes: ''
            })
            setShowModal(false)
            fetchData()
        } catch (error) {
            console.error('Error creating booking:', error)
            alert('Error al crear reserva')
        }
    }

    async function updateStatus(id: string, status: Booking['status']) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            fetchData()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    async function deleteBooking(id: string) {
        if (!confirm('¿Eliminar esta reserva?')) return

        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchData()
        } catch (error) {
            console.error('Error deleting booking:', error)
        }
    }

    const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter)

    const statusColors = {
        pendiente: '#ffc107',
        confirmada: '#28a745',
        cancelada: '#6c757d',
        completada: '#17a2b8'
    }

    if (loading) {
        return <div className="loading">Cargando...</div>
    }

    return (
        <div className="bookings-page">
            <div className="page-header">
                <h1>📋 Reservas</h1>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    + Nueva Reserva
                </button>
            </div>

            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todas
                </button>
                <button
                    className={`filter-btn ${filter === 'pendiente' ? 'active' : ''}`}
                    onClick={() => setFilter('pendiente')}
                >
                    Pendientes
                </button>
                <button
                    className={`filter-btn ${filter === 'confirmada' ? 'active' : ''}`}
                    onClick={() => setFilter('confirmada')}
                >
                    Confirmadas
                </button>
            </div>

            <div className="bookings-list">
                {filteredBookings.map((booking) => {
                    const cliente = booking.clientes as unknown as Cliente
                    const service = services.find(s => s.id === booking.service_id)

                    return (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <div className="booking-info">
                                    <h3>{cliente?.nombre || 'Cliente no encontrado'}</h3>
                                    <p className="service-name">{service?.name || 'Servicio'}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const message = formatConfirmationMessage(
                                            cliente?.nombre || '',
                                            formatDateSpanish(booking.booking_date),
                                            formatTime(booking.start_time)
                                        )
                                        window.open(generateWhatsAppLink(cliente?.telefono || '', message))
                                    }}
                                    className="btn-whatsapp"
                                    title="Confirmar por WhatsApp"
                                >
                                    📱
                                </button>
                            </div>

                            <div className="booking-details">
                                <p>📅 {new Date(booking.booking_date).toLocaleDateString('es-ES')}</p>
                                <p>🕐 {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                {booking.notes && <p className="notes">💬 {booking.notes}</p>}
                            </div>

                            <div className="booking-footer">
                                <div className="status-badge" style={{ backgroundColor: statusColors[booking.status] }}>
                                    {booking.status}
                                </div>

                                <div className="booking-actions">
                                    {booking.status === 'pendiente' && (
                                        <button onClick={() => updateStatus(booking.id, 'confirmada')} className="btn btn-sm btn-success">
                                            Confirmar
                                        </button>
                                    )}
                                    {(booking.status === 'pendiente' || booking.status === 'confirmada') && (
                                        <button onClick={() => updateStatus(booking.id, 'completada')} className="btn btn-sm">
                                            Completar
                                        </button>
                                    )}
                                    <button onClick={() => updateStatus(booking.id, 'cancelada')} className="btn btn-sm btn-warning">
                                        Cancelar
                                    </button>
                                    <button onClick={() => deleteBooking(booking.id)} className="btn btn-sm btn-danger">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredBookings.length === 0 && (
                <p className="empty-state">No hay reservas {filter !== 'all' ? filter + 's' : ''}</p>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Nueva Reserva</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Cliente *</label>
                                <select
                                    required
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Servicio *</label>
                                <select
                                    required
                                    value={formData.service_id}
                                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                >
                                    <option value="">Seleccionar servicio...</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fecha *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.booking_date}
                                        onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Hora inicio *</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Hora fin *</label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Observaciones adicionales..."
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Crear Reserva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        /* Similar styles as ClientsPage */
      `}</style>
        </div>
    )
}
