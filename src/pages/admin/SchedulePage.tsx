import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Loader } from '@/components/ui'
import { useToast } from '@/context/ToastContext'

interface ScheduleData {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function SchedulePage() {
    const toast = useToast()
    const [schedules, setSchedules] = useState<ScheduleData[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<number | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchSchedules()
    }, [])

    const fetchSchedules = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('schedules')
            .select('id, day_of_week, start_time, end_time, is_active')
            .order('day_of_week', { ascending: true })

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
                allDays.push({
                    id: '',
                    day_of_week: i,
                    start_time: '09:00',
                    end_time: '19:00',
                    is_active: i !== 0
                })
            }
        }

        setSchedules(allDays)
        setLoading(false)
    }

    const updateSchedule = (dayIndex: number, field: keyof ScheduleData, value: any) => {
        const newSchedules = [...schedules]
        newSchedules[dayIndex] = { ...newSchedules[dayIndex], [field]: value }
        setSchedules(newSchedules)
        setHasChanges(true)
    }

    const saveSchedule = async (dayIndex: number) => {
        const schedule = schedules[dayIndex]
        setSaving(dayIndex)

        try {
            if (schedule.id) {
                await (supabase
                    .from('schedules') as any)
                    .update({
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        is_active: schedule.is_active
                    } as any)
                    .eq('id', schedule.id)
            } else {
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
            toast.success(`${dayNames[schedule.day_of_week]} guardado`)
        } catch (error) {
            console.error('Error guardando horario:', error)
            toast.error('Error al guardar el horario')
        } finally {
            setSaving(null)
        }
    }

    const saveAll = async () => {
        for (let i = 0; i < 7; i++) {
            await saveSchedule(i)
        }
        setHasChanges(false)
        toast.success('Todos los horarios guardados')
    }

    if (loading) return <Loader />

    return (
        <div style={{ paddingBottom: '6rem' }}>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>🕐 Horarios</h2>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        Configura tu disponibilidad semanal
                    </p>
                </div>
            </div>

            {/* Schedule Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {schedules.map((schedule, idx) => (
                    <Card key={schedule.day_of_week}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            {/* Day Name + Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '140px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={schedule.is_active}
                                        onChange={(e) => updateSchedule(idx, 'is_active', e.target.checked)}
                                        style={{ width: '22px', height: '22px', accentColor: 'var(--color-primary)' }}
                                    />
                                    <span style={{ fontWeight: 600, opacity: schedule.is_active ? 1 : 0.5 }}>
                                        {dayNames[schedule.day_of_week]}
                                    </span>
                                </label>
                            </div>

                            {/* Time Inputs */}
                            {schedule.is_active ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    flex: 1,
                                    justifyContent: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    <input
                                        type="time"
                                        value={schedule.start_time}
                                        onChange={(e) => updateSchedule(idx, 'start_time', e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '1rem',
                                            minWidth: '110px'
                                        }}
                                    />
                                    <span style={{ fontWeight: 500 }}>a</span>
                                    <input
                                        type="time"
                                        value={schedule.end_time}
                                        onChange={(e) => updateSchedule(idx, 'end_time', e.target.value)}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '1rem',
                                            minWidth: '110px'
                                        }}
                                    />
                                </div>
                            ) : (
                                <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                    Cerrado
                                </div>
                            )}

                            {/* Save Button */}
                            <Button
                                size="sm"
                                onClick={() => saveSchedule(idx)}
                                isLoading={saving === idx}
                            >
                                💾
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Save All Button */}
            {hasChanges && (
                <div style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100
                }}>
                    <Button onClick={saveAll} style={{ padding: '1rem 2rem', fontSize: '1rem', boxShadow: 'var(--shadow-xl)' }}>
                        💾 Guardar Todo
                    </Button>
                </div>
            )}

            {/* Tip */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)'
            }}>
                💡 <strong>Tip:</strong> Los cambios se aplican a las nuevas reservas inmediatamente.
                Las reservas existentes no se ven afectadas.
            </div>
        </div>
    )
}
