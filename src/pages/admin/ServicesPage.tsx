import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Loader } from '@/components/ui'
import { Service } from '@/types/database.types'

interface ServiceFormData {
    name: string
    description: string
    duration_minutes: number
    price: number
    is_active: boolean
}

const emptyForm: ServiceFormData = {
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    is_active: true
}

export function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<ServiceFormData>(emptyForm)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('services')
            .select('*')
            .order('sort_order', { ascending: true })

        if (data) setServices(data)
        setLoading(false)
    }

    const openCreateModal = () => {
        setEditingId(null)
        setFormData(emptyForm)
        setShowModal(true)
    }

    const openEditModal = (service: Service) => {
        setEditingId(service.id)
        setFormData({
            name: service.name,
            description: service.description || '',
            duration_minutes: service.duration_minutes,
            price: service.price,
            is_active: service.is_active
        })
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFormData(emptyForm)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingId) {
                await (supabase
                    .from('services') as any)
                    .update(formData as any)
                    .eq('id', editingId)
            } else {
                await (supabase
                    .from('services') as any)
                    .insert({ ...formData, sort_order: services.length + 1 } as any)
            }

            closeModal()
            fetchServices()
        } catch (error) {
            console.error('Error guardando servicio:', error)
            alert('Error al guardar el servicio')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"?`)) return

        try {
            const { data, error } = await supabase
                .from('services')
                .delete()
                .eq('id', id)
                .select()

            if (error) {
                if (error.code === '23503') {
                    alert('⛔ No se puede eliminar este servicio porque tiene reservas asociadas.')
                } else {
                    alert(`Error al eliminar: ${error.message}`)
                }
                return
            }

            if (!data || data.length === 0) {
                alert('⚠️ No se ha eliminado el servicio.')
                return
            }

            fetchServices()
        } catch (error) {
            console.error('Error eliminando servicio:', error)
        }
    }

    const toggleActive = async (service: Service) => {
        try {
            await (supabase
                .from('services') as any)
                .update({ is_active: !service.is_active } as any)
                .eq('id', service.id)
            fetchServices()
        } catch (error) {
            console.error('Error actualizando servicio:', error)
        }
    }

    if (loading) return <Loader />

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <div className="page-header">
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>💇 Servicios</h2>
                <Button onClick={openCreateModal} className="desktop-only">+ Nuevo Servicio</Button>
            </div>

            {/* FAB Mobile */}
            <button onClick={openCreateModal} className="fab">➕</button>

            {/* Services List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {services.length === 0 ? (
                    <Card>
                        <p className="empty-state">No hay servicios. Crea el primero.</p>
                    </Card>
                ) : (
                    services.map(service => (
                        <Card key={service.id}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.25rem'
                                    }}>
                                        <span style={{
                                            fontWeight: 600,
                                            fontSize: '1.1rem',
                                            opacity: service.is_active ? 1 : 0.5
                                        }}>
                                            {service.name}
                                        </span>
                                        {!service.is_active && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.15rem 0.5rem',
                                                backgroundColor: 'gray',
                                                color: 'white',
                                                borderRadius: 'var(--radius-full)'
                                            }}>
                                                Inactivo
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                        ⏱️ {service.duration_minutes} min • 💰 {service.price}€
                                    </div>
                                    {service.description && (
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--color-text-tertiary)',
                                            marginTop: '0.25rem'
                                        }}>
                                            {service.description}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => toggleActive(service)}
                                        title={service.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {service.is_active ? '👁️' : '👁️‍🗨️'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => openEditModal(service)}
                                    >
                                        ✏️
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(service.id, service.name)}
                                    >
                                        🗑️
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>
                            {editingId ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ej: Corte de pelo"
                                    style={{ fontSize: '16px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descripción opcional"
                                    rows={3}
                                    style={{ fontSize: '16px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Duración (min) *</label>
                                    <input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                        required
                                        min={5}
                                        step={5}
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Precio (€) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        required
                                        min={0}
                                        step={0.5}
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <label htmlFor="is_active" style={{ margin: 0 }}>Servicio activo</label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <Button type="submit" isLoading={saving}>
                                    {editingId ? 'Guardar' : 'Crear'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
