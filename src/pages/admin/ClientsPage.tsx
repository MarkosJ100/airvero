import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Cliente } from '@/types/database.types'
import { generateWhatsAppLink, formatGenericMessage } from '@/lib/whatsapp'
import { useToast } from '@/context/ToastContext'

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
                // Actualizar
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
                // Crear nuevo
                const { error } = await supabase
                    .from('clientes')
                    .insert({
                        nombre: formData.nombre,
                        telefono: formData.telefono,
                        notas: formData.notas || null
                    })

                if (error) throw error
            }

            // Resetear y recargar
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

    if (loading) {
        return <div className="loading">Cargando...</div>
    }

    return (
        <div className="clients-page">
            <div className="page-header">
                <h1>👥 Clientes</h1>
                <button onClick={() => openModal()} className="btn btn-primary">
                    + Nuevo Cliente
                </button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

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

                        <p className="client-phone">{cliente.telefono}</p>

                        {cliente.notas && (
                            <p className="client-notes">"{cliente.notas}"</p>
                        )}

                        <div className="client-actions">
                            <button onClick={() => openModal(cliente)} className="btn btn-sm">
                                Editar
                            </button>
                            <button onClick={() => handleDelete(cliente.id)} className="btn btn-sm btn-danger">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClientes.length === 0 && (
                <p className="empty-state">
                    {searchTerm ? 'No se encontraron clientes' : 'No hay clientes aún. Crea el primero!'}
                </p>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Nombre completo"
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

            <style jsx>{`
        .clients-page {
          padding: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-box {
          margin-bottom: 2rem;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .clients-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .client-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: box-shadow 0.2s;
        }

        .client-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .client-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .client-header h3 {
          margin: 0;
          font-size: 1.25rem;
        }

        .btn-whatsapp {
          background: #25D366;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.25rem;
          transition: transform 0.2s;
        }

        .btn-whatsapp:hover {
          transform: scale(1.1);
        }

        .client-phone {
          color: #666;
          margin-bottom: 0.5rem;
        }

        .client-notes {
          font-style: italic;
          color: #888;
          font-size: 0.9rem;
          margin: 0.5rem 0;
        }

        .client-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .empty-state {
          text-align: center;
          color: #999;
          padding: 3rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
          font-size: 0.85rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .loading {
          text-align: center;
          padding: 3rem;
        }
      `}</style>
        </div>
    )
}
