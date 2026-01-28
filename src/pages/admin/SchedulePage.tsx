import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Loader } from '@/components/ui'

interface ScheduleData {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function SchedulePage() {
    const [schedules, setSchedules] = useState<ScheduleData[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<number | null>(null)

    useEffect(() => {
        fetchSchedules()
    }, [])

    const fetchSchedules = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('schedules')
            .select('id, day_of_week, start_time, end_time, is_active')
            .order('day_of_week', { ascending: true })

        // Asegurar que tenemos los 7 días
        const allDays: ScheduleData[] = []
        for (let i = 0; i < 7; i++) {
            const existing = (data as any[])?.find(s => s.day_of_week === i)
            if (existing) {
                allDays.push({
                    id: existing.id,
                    day_of_week: existing.day_of_week,
                    start_time: existing.start_time?.substring(0, 5) || '09:00',
                    end_time: existing.end_time?.substring(0, 5) || '19:00',
                    is_active: existing.is_active
                })
            } else {
                // Crear día si no existe
                allDays.push({
                    id: '',
                    day_of_week: i,
                    start_time: '09:00',
                    end_time: '19:00',
                    is_active: i !== 0 // Domingo cerrado por defecto
                })
            }
        }

        setSchedules(allDays)
        setLoading(false)
    }

    const updateSchedule = async (dayIndex: number, field: keyof ScheduleData, value: any) => {
        const schedule = schedules[dayIndex]
        const updated = { ...schedule, [field]: value }

        // Actualizar estado local inmediatamente
        const newSchedules = [...schedules]
        newSchedules[dayIndex] = updated
        setSchedules(newSchedules)
    }

    const saveSchedule = async (dayIndex: number) => {
        const schedule = schedules[dayIndex]
        setSaving(dayIndex)

        try {
            if (schedule.id) {
                // Actualizar existente
                await (supabase
                    .from('schedules') as any)
                    .update({
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        is_active: schedule.is_active
                    } as any)
                    .eq('id', schedule.id)
            } else {
                // Crear nuevo
                const { data } = await (supabase
                    .from('schedules') as any)
                    .insert({
                        day_of_week: schedule.day_of_week,
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        is_active: schedule.is_active
                    } as any)
                    .select('id')
                    .single()

                if (data) {
                    const newSchedules = [...schedules]
                    newSchedules[dayIndex] = { ...schedule, id: (data as any).id }
                    setSchedules(newSchedules)
                }
            }
        } catch (error) {
            console.error('Error guardando horario:', error)
            alert('Error al guardar el horario')
        } finally {
            setSaving(null)
        }
    }

    if (loading) return <Loader />

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2>Horarios de Apertura</h2>
                <p style={{ color: 'gray', marginTop: '0.5rem' }}>
                    Configura los días y horas en los que aceptas reservas.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {schedules.map((schedule, idx) => (
                    <Card key={schedule.day_of_week}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            {/* Nombre del día y toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                minWidth: '150px'
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={schedule.is_active}
                                        onChange={(e) => updateSchedule(idx, 'is_active', e.target.checked)}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    <span style={{
                                        fontWeight: 600,
                                        opacity: schedule.is_active ? 1 : 0.5
                                    }}>
                                        {dayNames[schedule.day_of_week]}
                                    </span>
                                </label>
                            </div>

                            {/* Horarios */}
                            {schedule.is_active ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flex: 1,
                                    justifyContent: 'center'
                                }}>
                                    <input
                                        type="time"
                                        value={schedule.start_time}
                                        onChange={(e) => updateSchedule(idx, 'start_time', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    />
                                    <span>a</span>
                                    <input
                                        type="time"
                                        value={schedule.end_time}
                                        onChange={(e) => updateSchedule(idx, 'end_time', e.target.value)}
                                        style={{
                                            padding: '0.5rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    color: 'gray',
                                    fontStyle: 'italic'
                                }}>
                                    Cerrado
                                </div>
                            )}

                            {/* Botón guardar */}
                            <Button
                                size="sm"
                                onClick={() => saveSchedule(idx)}
                                isLoading={saving === idx}
                            >
                                Guardar
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                color: 'gray'
            }}>
                💡 <strong>Tip:</strong> Los cambios se aplican inmediatamente a las nuevas reservas.
                Las reservas existentes no se ven afectadas.
            </div>
        </div>
    )
}
