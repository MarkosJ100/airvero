import { Outlet } from 'react-router-dom'

export function AuthLayout() {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg-secondary)'
        }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1>AIRVERO</h1>
                </div>
                <Outlet />
            </div>
        </div>
    )
}
