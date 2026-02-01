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
            toast.success('Stock actualizado')
            fetchProductos()
        } catch (error: any) {
            console.error('Error updating stock:', error)
            toast.error('Error al actualizar stock')
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
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem' }}>📦 Inventario de Productos</h2>
                <Button
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                    variant="primary"
                >
                    ➕ Nuevo Producto
                </Button>
            </div>

            {/* Estadísticas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
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

            {/* Búsqueda y Filtros */}
            <Card style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            border: '2px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '1rem'
                        }}
                    />
                    <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            border: '2px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '1rem'
                        }}
                    >
                        <option value="all">Todas las categorías</option>
                        {CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showStockBajo}
                            onChange={(e) => setShowStockBajo(e.target.checked)}
                        />
                        Solo stock bajo
                    </label>
                </div>
            </Card>

            {/* Tabla de Productos */}
            <Card>
                {loading ? (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Skeleton height="3rem" />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <Skeleton height="3rem" />
                        </div>
                        <Skeleton height="3rem" />
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                        No se encontraron productos
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Producto</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Categoría</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Stock</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>P. Compra</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>P. Venta</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosFiltrados.map(producto => (
                                    <tr key={producto.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{producto.nombre}</div>
                                            {producto.marca && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {producto.marca}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{producto.categoria}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => ajustarStock(producto.id, -1)}
                                                    style={{
                                                        background: 'var(--color-bg-secondary)',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        padding: '0.25rem 0.5rem',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    −
                                                </button>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: producto.stock_actual <= producto.stock_minimo ? 'var(--color-error)' : 'inherit',
                                                    minWidth: '3rem',
                                                    textAlign: 'center'
                                                }}>
                                                    {producto.stock_actual} {producto.unidad_medida}
                                                    {producto.stock_actual <= producto.stock_minimo && ' ⚠️'}
                                                </span>
                                                <button
                                                    onClick={() => ajustarStock(producto.id, 1)}
                                                    style={{
                                                        background: 'var(--color-success)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        padding: '0.25rem 0.5rem',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {producto.precio_compra ? `€${producto.precio_compra.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {producto.precio_venta ? `€${producto.precio_venta.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => openEditModal(producto)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1.2rem'
                                                    }}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(producto.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1.2rem'
                                                    }}
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal */}
            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '20px',
                            width: '90%',
                            maxWidth: '600px',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>
                            {editingProducto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid var(--color-border)',
                                            borderRadius: '10px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Categoría *
                                        </label>
                                        <select
                                            required
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            {CATEGORIAS.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Marca
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.marca}
                                            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Precio Compra (€)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.precio_compra}
                                            onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Precio Venta (€)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.precio_venta}
                                            onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Stock Actual *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock_actual}
                                            onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Stock Mínimo *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock_minimo}
                                            onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                            Unidad
                                        </label>
                                        <select
                                            value={formData.unidad_medida}
                                            onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: '10px',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <option value="unidad">unidad</option>
                                            <option value="ml">ml</option>
                                            <option value="gr">gr</option>
                                            <option value="l">litros</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <Button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        variant="secondary"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingProducto ? 'Actualizar' : 'Crear'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
