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
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'confirmada' | 'completada'>('all')

  // Formulario
  const [formData, setFormData] = useState({
    cliente_id: '',
    service_id: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    status: 'pendiente' as Booking['status'],
    notes: ''
  })
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [horaSugerida, setHoraSugerida] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [bookingsRes, clientesRes, servicesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`*, cliente:cliente_id (*), service:service_id (*)`)
          .order('booking_date', { ascending: false })
          .order('start_time'),
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('services').select('*').eq('is_active', true).order('name')
      ])

      if (bookingsRes.error) throw bookingsRes.error
      if (clientesRes.error) throw clientesRes.error
      if (servicesRes.error) throw servicesRes.error

      // NOTA: Supabase devuelve { cliente: {...}, service: {...} } gracias a los alias.
      // BookingWithRelations espera cliente?: Cliente y service?: Service.
      // El cast as strict BookingWithRelations[] funciona si los datos coinciden.
      setBookings(bookingsRes.data as unknown as BookingWithRelations[])
      setClientes(clientesRes.data || [])
      setServices(servicesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Lógica de sugerencia de hora
  useEffect(() => {
    if (formData.service_id && formData.booking_date) {
      const service = services.find(s => s.id === formData.service_id)
      if (service) {
        const sugerida = calcularProximoSlotDisponible(
          formData.booking_date,
          service.duration_minutes,
          bookings,
          '09:00',
          '20:00'
        )
        if (sugerida) {
          const fin = calcularHoraFin(sugerida, service.duration_minutes)
          setFormData(prev => ({ ...prev, start_time: sugerida, end_time: fin }))
          setHoraSugerida(true)
        }
      }
    }
  }, [formData.service_id, formData.booking_date])

  const handleStartTimeChange = (newStartTime: string) => {
    const service = services.find(s => s.id === formData.service_id)
    if (service && newStartTime) {
      const newEndTime = calcularHoraFin(newStartTime, service.duration_minutes)
      setFormData(prev => ({ ...prev, start_time: newStartTime, end_time: newEndTime }))
      setHoraSugerida(false)
    } else {
      setFormData(prev => ({ ...prev, start_time: newStartTime }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validación básica de conflictos
    const service = services.find(s => s.id === formData.service_id)
    if (service) {
      const { hayConflicto, reservaConflicto } = validarConflictoReservas(
        formData.booking_date,
        formData.start_time,
        service.duration_minutes,
        bookings
      )
      if (hayConflicto && reservaConflicto) {
        toast.error(`Conflicto con reserva a las ${formatTime(reservaConflicto.start_time)}`)
        return
      }
    }

    try {
      if (editingBookingId) {
        // ACTUALIZAR
        const { error } = await supabase.from('bookings').update({
          cliente_id: formData.cliente_id,
          service_id: formData.service_id,
          booking_date: formData.booking_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null
        }).eq('id', editingBookingId)

        if (error) throw error
        toast.success('Reserva actualizada')
      } else {
        // INSERTAR
        const { error } = await supabase.from('bookings').insert({
          cliente_id: formData.cliente_id,
          service_id: formData.service_id,
          booking_date: formData.booking_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: formData.status,
          notes: formData.notes || null
        })
        if (error) throw error
        toast.success('Reserva creada exitosamente')
      }

      setFormData({ cliente_id: '', service_id: '', booking_date: '', start_time: '', end_time: '', status: 'pendiente', notes: '' })
      setEditingBookingId(null)
      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error('Error al crear reserva')
    }
  }

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
      if (error) throw error
      toast.success(`Estado actualizado a ${status}`)
      fetchData()
    } catch (error) {
      toast.error('Error actualizando estado')
    }
  }

  const prepareEdit = (booking: BookingWithRelations) => {
    setFormData({
      cliente_id: booking.cliente_id || '',
      service_id: booking.service_id,
      booking_date: booking.booking_date,
      start_time: booking.start_time.substring(0, 5),
      end_time: booking.end_time.substring(0, 5),
      status: booking.status,
      notes: booking.notes || ''
    })
    setEditingBookingId(booking.id)
    setShowModal(true)
  }

  const deleteBooking = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar reserva de ${nombre}?`)) return
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
      toast.success('Reserva eliminada')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // Filtrado y Ordenamiento Inteligente
  const filteredBookings = bookings
    .filter(b => filter === 'all' || b.status === filter)
    .sort((a, b) => {
      // 1. Pendientes primero
      if (a.status === 'pendiente' && b.status !== 'pendiente') return -1
      if (a.status !== 'pendiente' && b.status === 'pendiente') return 1

      // 2. Por fecha (más cercana primero)
      const dateA = new Date(a.booking_date + 'T' + a.start_time)
      const dateB = new Date(b.booking_date + 'T' + b.start_time)
      return dateA.getTime() - dateB.getTime()
    })

  const getDayInfo = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
      weekday: date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
    }
  }

  if (loading) return (
    <div style={{ padding: '20px' }}>
      <div className="skeleton-premium skeleton-card"></div>
      <div className="skeleton-premium skeleton-card"></div>
      <div className="skeleton-premium skeleton-card"></div>
    </div>
  )

  return (
    <div style={{ paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Premium Header */}
      <div className="page-title-premium">
        <h1>Reservas</h1>
        <div className="subtitle">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {[
          { key: 'all', label: 'Todas', count: bookings.length },
          { key: 'pendiente', label: 'Pendientes', count: bookings.filter(b => b.status === 'pendiente').length },
          { key: 'confirmada', label: 'Confirmadas', count: bookings.filter(b => b.status === 'confirmada').length },
          { key: 'completada', label: 'Completadas', count: bookings.filter(b => b.status === 'completada').length }
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key as any)}
          >
            {filter === f.key && <span className="status-dot" style={{ background: 'var(--color-primary)' }}></span>}
            {f.label}
            <span className="count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state-premium">
          <div className="icon">📭</div>
          <h3>No hay reservas aquí</h3>
          <p>Parece que tienes el día libre en esta categoría</p>
          <button className="btn-action-primary" onClick={() => setShowModal(true)}>
            Crear nueva reserva
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((booking) => {
            const { day, month, weekday } = getDayInfo(booking.booking_date)
            // Aquí usamos el acceso seguro a las propiedades
            const clienteNombre = booking.cliente?.nombre || 'Cliente'
            const clienteTelefono = booking.cliente?.telefono
            const servicioNombre = booking.service?.name || 'Servicio'

            return (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-inner">
                  {/* Date Block */}
                  <div className="booking-date-block">
                    <span className="day">{day}</span>
                    <span className="month">{month}</span>
                    <span className="weekday">{weekday}</span>
                  </div>

                  {/* Content */}
                  <div className="booking-content">
                    <div className="booking-client">{clienteNombre}</div>
                    <div className="booking-service">{servicioNombre}</div>
                    <div className="booking-time">
                      ⏰ {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className={`booking-status ${booking.status}`}>
                    <span className={`status-dot ${booking.status}`}></span>
                    {booking.status}
                  </div>
                </div>

                {booking.notes && (
                  <div className="booking-notes">
                    "{booking.notes}"
                  </div>
                )}

                {/* Actions */}
                <div className="booking-actions">
                  {/* Primary Action Button Logic */}
                  {booking.status === 'pendiente' && (
                    <button className="btn-action-primary" onClick={() => updateStatus(booking.id, 'confirmada')}>
                      ✅ Confirmar
                    </button>
                  )}
                  {booking.status === 'confirmada' && (
                    <button className="btn-action-primary" style={{ background: 'var(--color-primary)' }} onClick={() => updateStatus(booking.id, 'completada')}>
                      ✨ Completar
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    className="btn-action-primary"
                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                    onClick={() => prepareEdit(booking)}
                  >
                    ✏️ Editar
                  </button>

                  {/* WhatsApp Button (Always visible) */}
                  <button
                    className="btn-action-whatsapp"
                    onClick={() => {
                      const msg = formatConfirmationMessage(clienteNombre, formatDateSpanish(booking.booking_date), formatTime(booking.start_time))
                      window.open(generateWhatsAppLink(clienteTelefono || '', msg))
                    }}
                  >
                    <span className="whatsapp-icon">💬</span> WhatsApp
                  </button>

                  {/* Delete/Cancel (Icon only) */}
                  <button
                    className="btn-action-danger"
                    style={{ flex: '0 0 auto', width: '48px', padding: '0' }}
                    onClick={() => deleteBooking(booking.id, clienteNombre)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Premium FAB */}
      <button
        className={`fab-premium ${showModal ? 'open' : ''}`}
        onClick={() => {
          setEditingBookingId(null)
          setFormData({ cliente_id: '', service_id: '', booking_date: '', start_time: '', end_time: '', status: 'pendiente', notes: '' })
          setShowModal(true)
        }}
        aria-label="Nueva Reserva"
      >
        <span className="plus-icon">➕</span>
      </button>

      {/* Premium Modal */}
      {showModal && (
        <div className="modal-premium-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-premium" onClick={e => e.stopPropagation()}>
            <div className="modal-premium-header">
              <h2>{editingBookingId ? '✏️ Editar Reserva' : '✨ Nueva Reserva'}</h2>
              <button className="modal-close-btn" onClick={() => {
                setShowModal(false)
                setEditingBookingId(null)
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-premium-body">
                <div className="form-field-premium">
                  <label>Cliente</label>
                  <select required value={formData.cliente_id} onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}>
                    <option value="">Selecciona un cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <div className="form-field-premium">
                  <label>Servicio</label>
                  <select required value={formData.service_id} onChange={e => setFormData({ ...formData, service_id: e.target.value })}>
                    <option value="">Selecciona un servicio...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-field-premium">
                    <label>Fecha</label>
                    <input type="date" required value={formData.booking_date} onChange={e => setFormData({ ...formData, booking_date: e.target.value })} />
                  </div>
                  <div className="form-field-premium">
                    <label>Hora</label>
                    <input type="time" required value={formData.start_time} onChange={e => handleStartTimeChange(e.target.value)} />
                    {horaSugerida && <div className="hint">✨ Hora sugerida automáticamente</div>}
                  </div>
                </div>

                <div className="form-field-premium">
                  <label>Notas (Opcional)</label>
                  <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Preferencias, detalles..." />
                </div>
              </div>

              <div className="modal-premium-footer">
                <button type="button" className="modal-btn-cancel" onClick={() => {
                  setShowModal(false)
                  setEditingBookingId(null)
                }}>
                  Cancelar
                </button>
                <button type="submit" className="modal-btn-submit">
                  {editingBookingId ? 'Guardar Cambios' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
