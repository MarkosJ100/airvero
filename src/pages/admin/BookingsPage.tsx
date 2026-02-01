
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking, Cliente, Service, BookingWithRelations } from '@/types/database.types'
import { generateWhatsAppLink, formatConfirmationMessage, formatDateSpanish, formatTime } from '@/lib/whatsapp'
import { useToast } from '@/context/ToastContext'
import { calcularProximoSlotDisponible, calcularHoraFin, validarConflictoReservas } from '@/utils/bookingHelpers'

export function BookingsPage() {
  const toast = useToast()
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
  const [horaSugerida, setHoraSugerida] = useState(false)

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
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Auto-sugerencia de hora cuando cambia servicio o fecha
  useEffect(() => {
    if (formData.service_id && formData.booking_date) {
      const service = services.find(s => s.id === formData.service_id)
      if (service) {
        const horaSugerida = calcularProximoSlotDisponible(
          formData.booking_date,
          service.duration_minutes,
          bookings,
          '09:00',
          '20:00'
        )

        if (horaSugerida) {
          const horaFin = calcularHoraFin(horaSugerida, service.duration_minutes)
          setFormData(prev => ({
            ...prev,
            start_time: horaSugerida,
            end_time: horaFin
          }))
          setHoraSugerida(true)
        }
      }
    }
  }, [formData.service_id, formData.booking_date, services, bookings])

  // Actualizar hora fin cuando cambia hora inicio manualmente
  function handleStartTimeChange(newStartTime: string) {
    const service = services.find(s => s.id === formData.service_id)
    if (service && newStartTime) {
      const newEndTime = calcularHoraFin(newStartTime, service.duration_minutes)
      setFormData(prev => ({ ...prev, start_time: newStartTime, end_time: newEndTime }))
      setHoraSugerida(false)
    } else {
      setFormData(prev => ({ ...prev, start_time: newStartTime }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validar conflictos antes de guardar
    const service = services.find(s => s.id === formData.service_id)
    if (service) {
      const { hayConflicto, reservaConflicto } = validarConflictoReservas(
        formData.booking_date,
        formData.start_time,
        service.duration_minutes,
        bookings
      )

      if (hayConflicto && reservaConflicto) {
        const clienteConflicto = bookings.find(b => b.id === reservaConflicto.id)?.cliente as Cliente | undefined
        toast.error(
          `Conflicto: Ya existe una reserva de ${clienteConflicto?.nombre || 'un cliente'} a las ${formatTime(reservaConflicto.start_time)}`
        )
        return
      }
    }

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
      setHoraSugerida(false)
      setShowModal(false)
      toast.success('Reserva creada correctamente')
      fetchData()
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error?.message || 'Error al crear reserva')
    }
  }

  async function updateStatus(id: string, status: Booking['status']) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      toast.success('Estado actualizado')
      fetchData()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error al actualizar estado')
    }
  }

  async function deleteBooking(id: string, clienteName: string) {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la reserva de ${clienteName}?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Reserva eliminada correctamente')
      fetchData()
    } catch (error: any) {
      console.error('Error deleting booking:', error)
      toast.error('Error al eliminar la reserva')
    }
  }

  const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter)

  const statusColors = {
    pendiente: 'var(--color-warning)',
    confirmada: 'var(--color-success)',
    cancelada: 'var(--color-error)',
    completada: 'var(--color-info)'
  }

  if (loading) return <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>Cargando reservas...</div>

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.8rem' }}>📋 Reservas</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary hide-mobile">
          ➕ Nueva Reserva
        </button>
      </div>

      {/* Mobile FAB */}
      <button onClick={() => setShowModal(true)} className="fab">
        ➕
      </button>

      {/* Filters Scrollable */}
      <div className="filters-scroll">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({bookings.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFilter('pendiente')}
        >
          🟡 Pendientes ({bookings.filter(b => b.status === 'pendiente').length})
        </button>
        <button
          className={`filter-btn ${filter === 'confirmada' ? 'active' : ''}`}
          onClick={() => setFilter('confirmada')}
        >
          🟢 Confirmadas ({bookings.filter(b => b.status === 'confirmada').length})
        </button>
      </div>

      {/* List Grid */}
      <div className="grid-responsive">
        {filteredBookings.map((booking) => {
          const cliente = booking.cliente as Cliente
          const service = services.find(s => s.id === booking.service_id)

          return (
            <div key={booking.id} className="card-mobile">
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{cliente?.nombre || 'Desconocido'}</h3>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {service?.name || 'Servicio'}
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  backgroundColor: statusColors[booking.status] || '#ccc',
                  color: 'white',
                  fontWeight: 600
                }}>
                  {booking.status.toUpperCase()}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📅 <strong>{new Date(booking.booking_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⏰ {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </div>
                {booking.notes && (
                  <div style={{ fontSize: '0.9rem', fontStyle: 'italic', background: 'var(--color-bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
                    💬 {booking.notes}
                  </div>
                )}
              </div>

              {/* WhatsApp Button Big */}
              <button
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const message = formatConfirmationMessage(cliente?.nombre || '', formatDateSpanish(booking.booking_date), formatTime(booking.start_time))
                  window.open(generateWhatsAppLink(cliente?.telefono || '', message))
                }}
              >
                📱 Hablar por WhatsApp
              </button>

              {/* Action Grid (Icon Buttons) */}
              <div className="actions-grid">
                {booking.status === 'pendiente' && (
                  <button className="action-btn-icon" onClick={() => updateStatus(booking.id, 'confirmada')} title="Confirmar">
                    <span style={{ fontSize: '1.2rem' }}>✅</span> Confirmar
                  </button>
                )}

                {(booking.status === 'pendiente' || booking.status === 'confirmada') && (
                  <button className="action-btn-icon" onClick={() => updateStatus(booking.id, 'completada')} title="Completar">
                    <span style={{ fontSize: '1.2rem' }}>✔️</span> Completar
                  </button>
                )}

                <button className="action-btn-icon" onClick={() => updateStatus(booking.id, 'cancelada')} title="Cancelar">
                  <span style={{ fontSize: '1.2rem' }}>❌</span> Cancelar
                </button>

                <button className="action-btn-icon" onClick={() => deleteBooking(booking.id, cliente?.nombre || '')} title="Eliminar">
                  <span style={{ fontSize: '1.2rem' }}>🗑️</span> Eliminar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p>No hay reservas encontradas</p>
        </div>
      )}

      {/* Modal - Improved for Mobile */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Nueva Reserva</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cliente</label>
                <select required value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Servicio</label>
                <select required value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}>
                  <option value="">Seleccionar...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fecha</label>
                  <input type="date" required value={formData.booking_date} onChange={e => setFormData({ ...formData, booking_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Hora {horaSugerida && '✨'}</label>
                  <input type="time" required value={formData.start_time} onChange={e => handleStartTimeChange(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notas</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} rows={3} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
