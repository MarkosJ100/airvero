import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types/database.types'
import { generateWhatsAppLink, formatGenericMessage } from '@/lib/whatsapp'
import { useToast } from '@/context/ToastContext'
import { Skeleton } from '@/components/ui'

export function ClientsPage() {
    const toast = useToast()
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        notas: ''
    })

    useEffect(() => {
        fetchClientes()
    }, [])

    async function fetchClientes() {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .order('nombre')

            if (error) throw error
            setClientes(data || [])
        } catch (error) {
            console.error('Error fetching clientes:', error)
            toast.error('Error al cargar clientes')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            if (editingCliente) {
                const { error } = await supabase
                    .from('clientes')
                    .update({
                        nombre: formData.nombre,
                        telefono: formData.telefono,
                        notas: formData.notas || null
                    })
                    .eq('id', editingCliente.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('clientes')
                    .insert({
                        nombre: formData.nombre,
                        telefono: formData.telefono,
                        notas: formData.notas || null
                    })

                if (error) throw error
            }

            setFormData({ nombre: '', telefono: '', notas: '' })
            setShowModal(false)
            setEditingCliente(null)
            toast.success(editingCliente ? 'Cliente actualizado' : 'Cliente creado')
            fetchClientes()
        } catch (error) {
            console.error('Error saving cliente:', error)
            toast.error('Error al guardar cliente')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este contacto?')) return

        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error al eliminar cliente:', error)
                toast.error(`Error al eliminar cliente: ${error.message}`)
                return
            }

            toast.success('Cliente eliminado correctamente')
            fetchClientes()
        } catch (error) {
            console.error('Error inesperado eliminando cliente:', error)
            toast.error('Error inesperado al eliminar cliente')
        }
    }

    function openModal(cliente?: Cliente) {
        if (cliente) {
            setEditingCliente(cliente)
            setFormData({
                nombre: cliente.nombre,
                telefono: cliente.telefono,
                notas: cliente.notas || ''
            })
        } else {
            setEditingCliente(null)
            setFormData({ nombre: '', telefono: '', notas: '' })
        }
        setShowModal(true)
    }

    function closeModal() {
        setShowModal(false)
        setEditingCliente(null)
        setFormData({ nombre: '', telefono: '', notas: '' })
    }

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono.includes(searchTerm)
    )

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <div className="page-header">
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>👥 Clientes</h2>
                <button onClick={() => openModal()} className="btn btn-primary desktop-only">
                    + Nuevo Cliente
                </button>
            </div>

            {/* FAB Mobile */}
            <button onClick={() => openModal()} className="fab">➕</button>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ width: '100%', maxWidth: '100%' }}
                />
            </div>

            {/* Loading */}
            {loading ? (
                <div className="clients-grid">
                    <Skeleton height="150px" />
                    <Skeleton height="150px" />
                    <Skeleton height="150px" />
                </div>
            ) : filteredClientes.length === 0 ? (
                <p className="empty-state">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes aún. ¡Crea el primero!'}
                </p>
            ) : (
                <div className="clients-grid">
                    {filteredClientes.map((cliente) => (
                        <div key={cliente.id} className="client-card">
                            <div className="client-header">
                                <h3>{cliente.nombre}</h3>
                                <button
                                    onClick={() => window.open(generateWhatsAppLink(cliente.telefono, formatGenericMessage(cliente.nombre)))}
                                    className="btn-whatsapp"
                                    title="Enviar WhatsApp"
                                >
                                    📱
                                </button>
                            </div>

                            <p className="client-phone">📞 {cliente.telefono}</p>

                            {cliente.notas && (
                                <p className="client-notes">"{cliente.notas}"</p>
                            )}

                            <div className="client-actions">
                                <button onClick={() => openModal(cliente)} className="btn btn-sm">
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(cliente.id)} className="btn btn-sm btn-danger">
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>{editingCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Nombre completo"
                                    style={{ fontSize: '16px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Teléfono *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="34612345678"
                                    style={{ fontSize: '16px' }}
                                />
                                <small>Formato internacional sin +</small>
                            </div>

                            <div className="form-group">
                                <label>Notas</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                    placeholder="Preferencias, observaciones..."
                                    rows={3}
                                    style={{ fontSize: '16px' }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingCliente ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
