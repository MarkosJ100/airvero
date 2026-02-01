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
        const clienteConflicto = bookings.find(b => b.id === reservaConflicto.id)?.clientes as Cliente | undefined
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
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error hint:', error?.hint)
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

      if (error) {
        console.error('Error al eliminar reserva:', error)
        toast.error(`Error al eliminar la reserva: ${error.message}`)
        return
      }

      toast.success('Reserva eliminada correctamente')
      fetchData()
    } catch (error) {
      console.error('Error inesperado eliminando reserva:', error)
      toast.error('Error inesperado al eliminar la reserva')
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
          ➕ Nueva Reserva
        </button>
      </div>

      <div className="filters">
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

      <div className="bookings-list">
        {filteredBookings.map((booking) => {
          const cliente = booking.cliente as Cliente
          const service = services.find(s => s.id === booking.service_id)

          return (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-info">
                  <h3>{cliente?.nombre || 'Cliente no encontrado'}</h3>
                  <p className="service-name">💇 {service?.name || 'Servicio'}</p>
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
                  <span className="whatsapp-icon">📱</span>
                  <span className="whatsapp-text">WhatsApp</span>
                </button>
              </div>

              <div className="booking-details">
                <p><strong>📅</strong> {new Date(booking.booking_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p><strong>🕐</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                {booking.notes && <p className="notes"><strong>💬</strong> {booking.notes}</p>}
              </div>

              <div className="booking-footer">
                <div className="status-badge" style={{ backgroundColor: statusColors[booking.status] }}>
                  {booking.status.toUpperCase()}
                </div>

                <div className="booking-actions">
                  {booking.status === 'pendiente' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'confirmada')}
                      className="action-btn btn-confirm"
                      title="Confirmar reserva"
                    >
                      ✅ Confirmar
                    </button>
                  )}
                  {(booking.status === 'pendiente' || booking.status === 'confirmada') && (
                    <button
                      onClick={() => updateStatus(booking.id, 'completada')}
                      className="action-btn btn-complete"
                      title="Marcar como completada"
                    >
                      ✔️ Completar
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(booking.id, 'cancelada')}
                    className="action-btn btn-cancel"
                    title="Cancelar reserva"
                  >
                    ❌ Cancelar
                  </button>
                  <button
                    onClick={() => deleteBooking(booking.id, cliente?.nombre || 'este cliente')}
                    className="action-btn btn-delete"
                    title="Eliminar reserva permanentemente"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <p className="empty-text">No hay reservas {filter !== 'all' ? filter + 's' : ''}</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            ➕ Crear Primera Reserva
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Nueva Reserva</h2>

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
                  <label>Hora inicio * {horaSugerida && <span style={{ color: 'var(--color-success)', fontSize: '0.875rem', marginLeft: '0.5rem' }}>✨ Sugerido</span>}</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Hora fin *</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    title="Se calcula automáticamente según la duración del servicio"
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
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  ✅ Crear Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .bookings-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          margin: 0;
          font-size: 2rem;
        }

        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid #ddd;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .filter-btn.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .bookings-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .booking-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .booking-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .booking-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.4rem;
          color: #333;
        }

        .service-name {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .btn-whatsapp {
          background: #25D366;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-whatsapp:hover {
          background: #20ba5a;
          transform: scale(1.05);
        }

        .whatsapp-icon {
          font-size: 1.5rem;
        }

        .booking-details {
          margin: 1rem 0;
        }

        .booking-details p {
          margin: 0.75rem 0;
          font-size: 1.05rem;
          color: #555;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .booking-details strong {
          font-size: 1.2rem;
        }

        .notes {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 8px;
          font-style: italic;
          color: #666;
        }

        .booking-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 2px solid #f0f0f0;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          letter-spacing: 0.5px;
        }

        .booking-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.75rem 1.25rem;
          border: 2px solid;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-confirm {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .btn-confirm:hover {
          background: #218838;
        }

        .btn-complete {
          background: #17a2b8;
          color: white;
          border-color: #17a2b8;
        }

        .btn-complete:hover {
          background: #138496;
        }

        .btn-cancel {
          background: #ffc107;
          color: #333;
          border-color: #ffc107;
        }

        .btn-cancel:hover {
          background: #e0a800;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .btn-delete:hover {
          background: #c82333;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #f8f9fa;
          border-radius: 16px;
          border: 2px dashed #ddd;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-text {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 2rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-content h2 {
          margin-top: 0;
          font-size: 1.8rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 1.05rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.875rem;
          border: 2px solid #ddd;
          border-radius: 10px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.875rem 1.75rem;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1.05rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .loading {
          text-align: center;
          padding: 3rem;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .bookings-list {
            grid-template-columns: 1fr;
          }

          .booking-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }

          .whatsapp-text {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
