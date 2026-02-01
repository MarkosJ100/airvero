import { Outlet, Link } from 'react-router-dom'
import { Button } from '@/components/ui'
export function MainLayout() {

    return (
        <div className="app">
            <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h1>AIRVERO</h1>
                </Link>
                <nav>
                    <Link to="/admin">
                        <Button variant="ghost" size="sm">Admin</Button>
                    </Link>
                </nav>
            </header>
            <main className="app-main" style={{ alignItems: 'flex-start' }}>
                <Outlet />
            </main>
        </div>
    )
}
