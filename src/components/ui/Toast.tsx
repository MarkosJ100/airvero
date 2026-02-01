import { useEffect } from 'react'
import '@/styles/toast.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
    id: string
    message: string
    type: ToastType
    duration?: number
    onClose: (id: string) => void
}

export function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id)
        }, duration)

        return () => clearTimeout(timer)
    }, [id, duration, onClose])

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }

    const colors = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B'
    }

    return (
        <div
            className="toast"
            style={{
                backgroundColor: 'white',
                border: `2px solid ${colors[type]}`,
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                animation: 'slideInRight 0.3s ease-out, fadeOut 0.3s ease-in forwards',
                animationDelay: `0s, ${duration - 300}ms`,
                minWidth: '300px',
                maxWidth: '500px'
            }}
        >
            <span style={{ fontSize: '1.5rem' }}>{icons[type]}</span>
            <p style={{ margin: 0, flex: 1, color: '#0F172A', fontWeight: 500 }}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '0.25rem',
                    lineHeight: 1
                }}
                aria-label="Cerrar notificación"
            >
                ×
            </button>
        </div>
    )
}
