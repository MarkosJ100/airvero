import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader } from '@/components/ui'

export function ProtectedRoute({
    requireAdmin = false
}: {
    requireAdmin?: boolean
}) {
    const { user, isAdmin, loading } = useAuth()

    if (loading) return <Loader fullScreen />

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (requireAdmin && !isAdmin) {
        // Si intenta acceder a admin sin serlo, redirigir a cliente
        return <Navigate to="/client/reservar" replace />
    }

    return <Outlet />
}
