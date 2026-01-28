// Database type definitions for AIRVERO v2.0

export type UserRole = 'admin' | 'cliente'

export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'

export interface Profile {
    id: string
    user_id: string
    full_name: string
    phone: string | null
    role: UserRole
    created_at: string
    updated_at: string
}

export interface SalonConfig {
    id: string
    name: string
    description: string | null
    address: string | null
    phone: string | null
    email: string | null
    default_duration_minutes: number
    booking_advance_days: number
    cancellation_hours: number
    created_at: string
    updated_at: string
}

export interface Service {
    id: string
    name: string
    description: string | null
    duration_minutes: number
    price: number
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface Schedule {
    id: string
    day_of_week: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
    start_time: string // TIME format
    end_time: string // TIME format
    is_active: boolean
    created_at: string
    updated_at: string
}

// =============================================
// v2.0: NUEVA TABLA - Contactos internos
// =============================================

export interface Cliente {
    id: string
    nombre: string
    telefono: string
    notas: string | null
    created_at: string
    updated_at: string
}

// =============================================
// v2.0: ACTUALIZACIÓN - Bookings con cliente_id
// =============================================

export interface Booking {
    id: string
    client_id: string | null // DEPRECATED: v1.0 - FK a profiles (mantener temporalmente)
    cliente_id: string | null // v2.0 - FK a clientes
    service_id: string
    booking_date: string // DATE format
    start_time: string // TIME format
    end_time: string // TIME format
    status: BookingStatus
    notes: string | null
    gcal_event_id: string | null // Referencia Google Calendar (no sync activo)
    client_id_backup: string | null // Backup para rollback seguro
    created_at: string
    updated_at: string
}

// =============================================
// Google Calendar (mantenido para referencia)
// =============================================

export interface GoogleCalendarToken {
    id: string
    access_token: string
    refresh_token: string
    expires_at: string
    calendar_id: string | null
    created_at: string
    updated_at: string
}

// =============================================
// Tipos con relaciones (para queries con JOIN)
// =============================================

export interface BookingWithRelations extends Booking {
    cliente?: Cliente
    service?: Service
    profile?: Profile // v1.0 - deprecated
}

export interface ClienteWithBookings extends Cliente {
    bookings?: Booking[]
}
