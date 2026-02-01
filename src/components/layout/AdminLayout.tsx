import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui'

export function AdminLayout() {
    const location = useLocation()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    const closeSidebar = () => setIsSidebarOpen(false)

    const navLinks = [
        { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { to: '/admin/calendar', icon: '📅', label: 'Agenda' },
        { to: '/admin/bookings', icon: '📋', label: 'Reservas' },
        { to: '/admin/clients', icon: '👥', label: 'Clientes' },
        { to: '/admin/inventory', icon: '📦', label: 'Inventario' },
        { to: '/admin/services', icon: '💇', label: 'Servicios' },
        { to: '/admin/schedule', icon: '🕐', label: 'Horarios' },
        { to: '/admin/settings', icon: '⚙️', label: 'Ajustes' },
    ]

    return (
        <div className="app-container" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

            {/* Mobile Header (Solo visible en movil) */}
            <div className="mobile-header" style={{
                display: 'none', // Default hidden, shown by media query
                padding: '1rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-card)',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>AIRVERO</h2>
                <Button variant="ghost" onClick={toggleSidebar} style={{ padding: '0.5rem' }}>
                    🍔
                </Button>
            </div>

            {/* Overlay para cerrar sidebar en movil */}
            {isSidebarOpen && (
                <div
                    className="overlay"
                    onClick={closeSidebar}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40
                    }}
                />
            )}

            {/* Sidebar Responsive */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
                width: '250px',
                backgroundColor: 'var(--color-bg-secondary)',
                padding: '1.5rem',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'sticky', // Desktop default
                top: 0,
                zIndex: 50,
                transition: 'transform 0.3s ease',
                // Mobile styles applied via CSS class .sidebar in @media query
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 className="gradient-text">AIRVERO</h2>
                    <button
                        className="mobile-only"
                        onClick={closeSidebar}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }} // Solo visible en movil via CSS
                    >
                        ✕
                    </button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={closeSidebar}
                            className={`btn btn-ghost ${location.pathname === link.to ? 'active' : ''}`}
                            style={{
                                justifyContent: 'flex-start',
                                background: location.pathname === link.to ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                color: location.pathname === link.to ? 'var(--color-primary)' : 'inherit',
                                fontWeight: location.pathname === link.to ? '600' : 'normal'
                            }}
                        >
                            <span style={{ marginRight: '0.75rem' }}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                    AIRVERO v2.3
                </div>
            </aside>

            {/* Content */}
            <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto', width: '100%' }}>
                <Outlet />
            </main>
        </div>
    )
}
