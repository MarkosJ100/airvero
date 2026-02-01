import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { CalendarPage } from '@/pages/admin/CalendarPage'
import { BookingsPage } from '@/pages/admin/BookingsPage'
import { ClientsPage } from '@/pages/admin/ClientsPage'
import { InventoryPage } from '@/pages/admin/InventoryPage'
import { ServicesPage } from '@/pages/admin/ServicesPage'
import { SchedulePage } from '@/pages/admin/SchedulePage'
import { SettingsPage } from '@/pages/admin/SettingsPage'

const router = createHashRouter([
    // Root redirect to admin
    {
        path: '/',
        element: <Navigate to="/admin/dashboard" replace />,
    },

    // Admin Routes (Direct Access)
    {
        path: '/admin',
        children: [
            {
                element: <AdminLayout />,
                children: [
                    { index: true, element: <Navigate to="dashboard" replace /> },
                    { path: 'dashboard', element: <DashboardPage /> },
                    { path: 'calendar', element: <CalendarPage /> },
                    { path: 'bookings', element: <BookingsPage /> },
                    { path: 'clients', element: <ClientsPage /> },
                    { path: 'inventory', element: <InventoryPage /> },
                    { path: 'services', element: <ServicesPage /> },
                    { path: 'schedule', element: <SchedulePage /> },
                    { path: 'settings', element: <SettingsPage /> },
                ],
            },
        ],
    },
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
