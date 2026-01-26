

export function Loader({ fullScreen = false }: { fullScreen?: boolean }) {
    if (fullScreen) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100%',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'var(--color-bg-primary)',
                zIndex: 50
            }}>
                <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
            </div>
        )
    }

    return <div className="spinner"></div>
}
