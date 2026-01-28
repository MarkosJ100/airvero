import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Card, Loader, Input } from '@/components/ui'
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
                // Actualizar
                await (supabase
                    .from('services') as any)
                    .update(formData as any)
                    .eq('id', editingId)
            } else {
                // Crear
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
        if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"?
Esta acción es irreversible y podría fallar si hay reservas asociadas.`)) return

        try {
            const { data, error } = await supabase
                .from('services')
                .delete()
                .eq('id', id)
                .select()

            if (error) {
                console.error('Error de Supabase al eliminar servicio:', error)

                if (error.code === '23503') {
                    alert('⛔ No se puede eliminar este servicio porque tiene reservas asociadas.\n\n💡 Solución: Edita el servicio y desmarca la casilla "Servicio activo" para ocultarlo al público sin perder el historial.')
                } else if (error.code === '42501') {
                    alert('⛔ No tienes permisos para eliminar servicios.\n\nSolo el administrador puede realizar esta acción.')
                } else {
                    alert(`Error al eliminar: ${error.message} (Código: ${error.code})`)
                }
                return
            }

            // Si no hay error pero tampoco data, es que no borró nada (posible RLS silencioso)
            if (!data || data.length === 0) {
                alert('⚠️ No se ha eliminado el servicio.\n\nPosible causa: No tienes permisos de administrador.')
                return
            }

            // Exito
            fetchServices()
            alert('✅ Servicio eliminado correctamente')
        } catch (error) {
            console.error('Error inesperado eliminando servicio:', error)
            alert('Error inesperado al eliminar el servicio.')
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
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h2>Servicios</h2>
                <Button onClick={openCreateModal}>+ Nuevo Servicio</Button>
            </div>

            {/* Lista de Servicios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {services.length === 0 ? (
                    <Card>
                        <p style={{ textAlign: 'center', color: 'gray', padding: '2rem' }}>
                            No hay servicios. Crea el primero.
                        </p>
                    </Card>
                ) : (
                    services.map(service => (
                        <Card key={service.id}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ flex: 1 }}>
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
                                    <div style={{ color: 'gray', fontSize: '0.9rem' }}>
                                        {service.duration_minutes} min • {service.price}€
                                    </div>
                                    {service.description && (
                                        <div style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--color-text-secondary)',
                                            marginTop: '0.25rem'
                                        }}>
                                            {service.description}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => toggleActive(service)}
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
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>
                            {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Nombre *</label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ej: Corte de pelo"
                                    />
                                </div>

                                <div>
                                    <label>Descripción</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descripción opcional del servicio"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label>Duración (min) *</label>
                                        <Input
                                            type="number"
                                            value={formData.duration_minutes}
                                            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                            required
                                            min={5}
                                            step={5}
                                        />
                                    </div>

                                    <div>
                                        <label>Precio (€) *</label>
                                        <Input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                            required
                                            min={0}
                                            step={0.5}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="is_active" style={{ margin: 0 }}>Servicio activo</label>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                marginTop: '1.5rem',
                                justifyContent: 'flex-end'
                            }}>
                                <Button type="button" variant="secondary" onClick={closeModal}>
                                    Cancelar
                                </Button>
                                <Button type="submit" isLoading={saving}>
                                    {editingId ? 'Guardar Cambios' : 'Crear Servicio'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
