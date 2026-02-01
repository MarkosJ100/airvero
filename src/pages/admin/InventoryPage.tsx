
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { Button, Card, Skeleton } from '@/components/ui'
import type { Producto } from '@/types/database.types'

const CATEGORIAS = [
    'Shampoo',
    'Acondicionador',
    'Tinte',
    'Tratamiento',
    'Styling',
    'Herramientas',
    'Otros'
]

export function InventoryPage() {
    const toast = useToast()
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategoria, setFilterCategoria] = useState<string>('all')
    const [showStockBajo, setShowStockBajo] = useState(false)

    const [formData, setFormData] = useState({
        nombre: '',
        categoria: 'Shampoo',
        marca: '',
        descripcion: '',
        codigo_barras: '',
        precio_compra: '',
        precio_venta: '',
        stock_actual: '0',
        stock_minimo: '5',
        stock_maximo: '',
        unidad_medida: 'unidad',
        ubicacion: '',
        proveedor: '',
        notas: ''
    })

    useEffect(() => {
        fetchProductos()
    }, [])

    async function fetchProductos() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('is_active', true)
                .order('nombre')

            if (error) throw error
            setProductos(data || [])
        } catch (error: any) {
            console.error('Error fetching productos:', error)
            toast.error('Error al cargar productos')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        try {
            const productoData = {
                nombre: formData.nombre,
                categoria: formData.categoria,
                marca: formData.marca || null,
                descripcion: formData.descripcion || null,
                codigo_barras: formData.codigo_barras || null,
                precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
                precio_venta: formData.precio_venta ? parseFloat(formData.precio_venta) : null,
                stock_actual: parseInt(formData.stock_actual),
                stock_minimo: parseInt(formData.stock_minimo),
                stock_maximo: formData.stock_maximo ? parseInt(formData.stock_maximo) : null,
                unidad_medida: formData.unidad_medida,
                ubicacion: formData.ubicacion || null,
                proveedor: formData.proveedor || null,
                notas: formData.notas || null
            }

            if (editingProducto) {
                const { error } = await supabase
                    .from('productos')
                    .update(productoData)
                    .eq('id', editingProducto.id)

                if (error) throw error
                toast.success('Producto actualizado')
            } else {
                const { error } = await supabase
                    .from('productos')
                    .insert(productoData)

                if (error) throw error
                toast.success('Producto creado')
            }

            resetForm()
            setShowModal(false)
            fetchProductos()
        } catch (error: any) {
            console.error('Error saving producto:', error)
            toast.error(error?.message || 'Error al guardar producto')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este producto?')) return

        try {
            const { error } = await supabase
                .from('productos')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error
            toast.success('Producto eliminado')
            fetchProductos()
        } catch (error: any) {
            console.error('Error deleting producto:', error)
            toast.error(error?.message || 'Error al eliminar producto')
        }
    }

    async function ajustarStock(id: string, cantidad: number) {
        try {
            const producto = productos.find(p => p.id === id)
            if (!producto) return

            const nuevoStock = Math.max(0, producto.stock_actual + cantidad)

            const { error } = await supabase
                .from('productos')
                .update({ stock_actual: nuevoStock })
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            setProductos(prev => prev.map(p => p.id === id ? { ...p, stock_actual: nuevoStock } : p))
            toast.success('Stock actualizado')
        } catch (error: any) {
            console.error('Error updating stock:', error)
            toast.error('Error al actualizar stock')
            fetchProductos() // Revert on error
        }
    }

    function resetForm() {
        setFormData({
            nombre: '',
            categoria: 'Shampoo',
            marca: '',
            descripcion: '',
            codigo_barras: '',
            precio_compra: '',
            precio_venta: '',
            stock_actual: '0',
            stock_minimo: '5',
            stock_maximo: '',
            unidad_medida: 'unidad',
            ubicacion: '',
            proveedor: '',
            notas: ''
        })
        setEditingProducto(null)
    }

    function openEditModal(producto: Producto) {
        setEditingProducto(producto)
        setFormData({
            nombre: producto.nombre,
            categoria: producto.categoria,
            marca: producto.marca || '',
            descripcion: producto.descripcion || '',
            codigo_barras: producto.codigo_barras || '',
            precio_compra: producto.precio_compra?.toString() || '',
            precio_venta: producto.precio_venta?.toString() || '',
            stock_actual: producto.stock_actual.toString(),
            stock_minimo: producto.stock_minimo.toString(),
            stock_maximo: producto.stock_maximo?.toString() || '',
            unidad_medida: producto.unidad_medida,
            ubicacion: producto.ubicacion || '',
            proveedor: producto.proveedor || '',
            notas: producto.notas || ''
        })
        setShowModal(true)
    }

    // Filtrado
    const productosFiltrados = productos.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchCategoria = filterCategoria === 'all' || p.categoria === filterCategoria
        const matchStockBajo = !showStockBajo || p.stock_actual <= p.stock_minimo

        return matchSearch && matchCategoria && matchStockBajo
    })

    // Estadísticas
    const totalProductos = productos.length
    const productosStockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo).length
    const valorTotal = productos.reduce((sum, p) =>
        sum + (p.precio_venta || 0) * p.stock_actual, 0
    )

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <div className="page-header">
                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>📦 Inventario</h2>
                <div className="desktop-only">
                    <Button onClick={() => { resetForm(); setShowModal(true); }} variant="primary">
                        ➕ Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Mobile FAB */}
            <button onClick={() => { resetForm(); setShowModal(true); }} className="fab">
                ➕
            </button>

            {/* Estadísticas Responsive */}
            <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
                <Card>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Productos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalProductos}</div>
                </Card>
                <Card>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Stock Bajo</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--color-error)' }}>
                        {productosStockBajo}
                    </div>
                </Card>
                <Card>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Valor Total</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>
                        €{valorTotal.toFixed(2)}
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                    />
                    <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                    >
                        <option value="all">Todas las categorías</option>
                        {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showStockBajo} onChange={(e) => setShowStockBajo(e.target.checked)} />
                        Mostrar solo stock bajo ⚠️
                    </label>
                </div>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando inventario...</div>
            ) : productosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No se encontraron productos</div>
            ) : (
                <>
                    {/* DESKTOP VIEW: Table */}
                    <Card className="desktop-only" padding="0">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--color-bg-secondary)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Producto</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Categoría</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>P. Venta</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosFiltrados.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{p.marca}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{p.categoria}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => ajustarStock(p.id, -1)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>-</button>
                                                <span style={{ fontWeight: 600, color: p.stock_actual <= p.stock_minimo ? 'red' : 'inherit' }}>
                                                    {p.stock_actual}
                                                </span>
                                                <button onClick={() => ajustarStock(p.id, 1)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {p.precio_venta ? `€${p.precio_venta}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button onClick={() => openEditModal(p)} style={{ marginRight: '0.5rem', cursor: 'pointer', background: 'none', border: 'none' }}>✏️</button>
                                            <button onClick={() => handleDelete(p.id)} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>

                    {/* MOBILE VIEW: Cards */}
                    <div className="mobile-only grid-responsive">
                        {productosFiltrados.map(p => (
                            <div key={p.id} className="card-mobile">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{p.nombre}</h3>
                                    <span style={{ fontSize: '0.85rem', background: 'var(--color-bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {p.categoria}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                    {p.marca}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Stock Actual</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: p.stock_actual <= p.stock_minimo ? 'red' : 'inherit' }}>
                                            {p.stock_actual} {p.unidad_medida}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => ajustarStock(p.id, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', background: 'white' }}>-</button>
                                        <button onClick={() => ajustarStock(p.id, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--color-success)', color: 'white' }}>+</button>
                                    </div>
                                </div>

                                <div className="actions-grid">
                                    <button className="action-btn-icon" onClick={() => openEditModal(p)}>
                                        <span>✏️</span> Editar
                                    </button>
                                    <button className="action-btn-icon" onClick={() => handleDelete(p.id)}>
                                        <span>🗑️</span> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{editingProducto ? '✏️ Editar' : '➕ Nuevo Producto'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input placeholder="Nombre *" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />

                            <select value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="number" placeholder="Stock" value={formData.stock_actual} onChange={e => setFormData({ ...formData, stock_actual: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                <input type="number" placeholder="Minimo" value={formData.stock_minimo} onChange={e => setFormData({ ...formData, stock_minimo: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="number" placeholder="P. Venta" value={formData.precio_venta} onChange={e => setFormData({ ...formData, precio_venta: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                                <input type="number" placeholder="P. Compra" value={formData.precio_compra} onChange={e => setFormData({ ...formData, precio_compra: e.target.value })} className="input-field" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
