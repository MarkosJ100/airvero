import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui'

export function AdminLayout() {
    const { signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar simple */}
            <aside style={{
                width: '250px',
                backgroundColor: 'var(--color-bg-secondary)',
                padding: '2rem',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h2 style={{ marginBottom: '2rem' }}>Panel Admin</h2>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link to="/admin/dashboard" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>📊 Dashboard</Link>
                    <Link to="/admin/calendar" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>📅 Agenda</Link>
                    <Link to="/admin/bookings" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>📋 Reservas</Link>
                    <Link to="/admin/clients" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>👥 Clientes</Link>
                    <Link to="/admin/inventory" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>📦 Inventario</Link>
                    <Link to="/admin/services" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>💇 Servicios</Link>
                    <Link to="/admin/schedule" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>🕐 Horarios</Link>
                    <Link to="/admin/settings" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>⚙️ Ajustes</Link>
                </nav>

                <Button variant="secondary" onClick={handleSignOut} fullWidth>
                    Cerrar Sesión
                </Button>
            </aside>

            {/* Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    )
}
