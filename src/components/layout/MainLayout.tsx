import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui'

export function MainLayout() {
    const { user } = useAuth()

    return (
        <div className="app">
            <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1>AIRVERO</h1>
                </Link>
                <nav>
                    {user ? (
                        <Link to="/client/reservas">
                            <Button variant="ghost" size="sm">Mis Reservas</Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                        </Link>
                    )}
                </nav>
            </header>
            <main className="app-main" style={{ alignItems: 'flex-start' }}>
                <Outlet />
            </main>
        </div>
    )
}
