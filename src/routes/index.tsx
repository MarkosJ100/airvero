import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { CalendarPage } from '@/pages/admin/CalendarPage'
import { ServicesPage } from '@/pages/admin/ServicesPage'
import { SchedulePage } from '@/pages/admin/SchedulePage'
import { NewBookingPage } from '@/pages/client/NewBookingPage'
import { ClientBookingsPage } from '@/pages/client/ClientBookingsPage'

import { SettingsPage } from '@/pages/admin/SettingsPage'
import { LandingPage } from '@/pages/public/LandingPage'
// Componentes temporales para probar rutas
const Placeholder = ({ title }: { title: string }) => (
    <div style={{ padding: '20px' }}>
        <h2>{title}</h2>
        <p>Página en construcción...</p>
    </div>
)

const router = createBrowserRouter([
    // Rutas Públicas
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <LandingPage /> },
        ],
    },

    // Rutas Auth
    {
        element: <AuthLayout />,
        children: [
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
        ],
    },

    // Rutas Admin
    {
        path: '/admin',
        element: <ProtectedRoute requireAdmin />,
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <DashboardPage /> },
                    { path: 'calendar', element: <CalendarPage /> },
                    { path: 'services', element: <ServicesPage /> },
                    { path: 'schedule', element: <SchedulePage /> },
                    { path: 'settings', element: <SettingsPage /> },
                ],
            },
        ],
    },

    // Rutas Cliente
    {
        path: '/client',
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { index: true, element: <Navigate to="reservar" replace /> },
                    { path: 'reservar', element: <NewBookingPage /> },
                    { path: 'reservas', element: <ClientBookingsPage /> },
                ],
            },
        ],
    },
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
