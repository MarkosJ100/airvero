import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Loader } from '@/components/ui'
import { Service, Schedule } from '@/types/database.types'

// Pasos del Wizard
type WizardStep = 'SERVICE' | 'DATE' | 'CONFIRM'

export function NewBookingPage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [step, setStep] = useState<WizardStep>('SERVICE')
    const [loading, setLoading] = useState(false)

    // Datos
    const [services, setServices] = useState<Service[]>([])
    const [schedules, setSchedules] = useState<Schedule[]>([])

    // Selección
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')

    // Cargar datos iniciales
    useEffect(() => {
        fetchServices()
        fetchSchedules()
    }, [])

    const fetchServices = async () => {
        const { data } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        if (data) setServices(data)
    }

    const fetchSchedules = async () => {
        const { data } = await supabase.from('schedules').select('*')
        if (data) setSchedules(data)
    }

    // Generar slots de tiempo disponibles (simplificado)
    const generateTimeSlots = () => {
        if (!selectedDate || !selectedService) return []

        const dayOfWeek = new Date(selectedDate).getDay() // 0=Dom, 1=Lun...
        const schedule = schedules.find(s => s.day_of_week === dayOfWeek)

        if (!schedule || !schedule.is_active) return []

        const slots: string[] = []
        let current = new Date(`2000-01-01T${schedule.start_time}`)
        const end = new Date(`2000-01-01T${schedule.end_time}`)
        const duration = selectedService.duration_minutes

        while (current.getTime() + duration * 60000 <= end.getTime()) {
            const timeString = current.toTimeString().substring(0, 5)
            slots.push(timeString)
            // Avanzar exacto la duración del servicio (o intervalo de 30min si se prefiere)
            current = new Date(current.getTime() + 30 * 60000) // Intervalos de 30 min
        }

        return slots
    }

    const handleBooking = async () => {
        if (!user || !selectedService || !selectedDate || !selectedTime) return

        setLoading(true)
        try {
            // Calcular hora fin
            const start = new Date(`2000-01-01T${selectedTime}`)
            const end = new Date(start.getTime() + selectedService.duration_minutes * 60000)
            const endTime = end.toTimeString().substring(0, 5)

            // Obtener ID cliente con cast seguro
            const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
            const client_id = (profile as any)?.id

            // Insertar reserva con cast a any para evitar conflicto de tipos 'never'
            const { error } = await (supabase.from('bookings') as any).insert({
                client_id: client_id,
                service_id: selectedService.id,
                booking_date: selectedDate,
                start_time: selectedTime,
                end_time: endTime,
                status: 'pendiente'
            })

            if (error) throw error

            navigate('/client/reservas')
        } catch (error) {
            console.error('Error creating booking:', error)
            alert('Error al crear la reserva')
        } finally {
            setLoading(false)
        }
    }

    // Renderizado de Pasos
    const renderServiceStep = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <h3>1. Selecciona un Servicio</h3>
            {services.map(service => (
                <Card
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep('DATE') }}
                    style={{ cursor: 'pointer', border: selectedService?.id === service.id ? '2px solid black' : undefined }}
                    className="hover:bg-gray-50"
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{service.name}</span>
                        <span>{service.price}€</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'gray', marginTop: '0.5rem' }}>
                        {service.duration_minutes} min • {service.description}
                    </div>
                </Card>
            ))}
        </div>
    )

    const renderDateStep = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>2. Fecha y Hora</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep('SERVICE')}>← Volver</Button>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha</label>
                <input
                    type="date"
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime('') }}
                    style={{ width: '100%' }}
                />
            </div>

            {selectedDate && (
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Horas Disponibles</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                        {generateTimeSlots().length > 0 ? (
                            generateTimeSlots().map(time => (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setSelectedTime(time)}
                                >
                                    {time}
                                </Button>
                            ))
                        ) : (
                            <p style={{ color: 'red' }}>No hay horas disponibles (o cerrado)</p>
                        )}
                    </div>
                </div>
            )}

            <Button disabled={!selectedTime} onClick={() => setStep('CONFIRM')} fullWidth>
                Continuar
            </Button>
        </div>
    )

    const renderConfirmStep = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>3. Confirmar Reserva</h3>

            <Card>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Servicio:</strong> {selectedService?.name}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Fecha:</strong> {selectedDate} a las {selectedTime}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Precio:</strong> {selectedService?.price}€
                </div>
                <div>
                    <strong>Duración:</strong> {selectedService?.duration_minutes} min
                </div>
            </Card>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button variant="secondary" onClick={() => setStep('DATE')} fullWidth>
                    Atrás
                </Button>
                <Button onClick={handleBooking} isLoading={loading} fullWidth>
                    Confirmar Reserva
                </Button>
            </div>
        </div>
    )

    if (loading && !selectedService) return <Loader />

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {step === 'SERVICE' && renderServiceStep()}
            {step === 'DATE' && renderDateStep()}
            {step === 'CONFIRM' && renderConfirmStep()}
        </div>
    )
}
