/**
 * AIRVERO - Tipos de Base de Datos
 * 
 * Generado para el esquema de Supabase.
 * Para regenerar automáticamente:
 * npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Enums
export type UserRole = 'admin' | 'cliente'
export type BookingStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'

// Tipos de tablas
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
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Booking {
    id: string
    client_id: string
    service_id: string
    booking_date: string
    start_time: string
    end_time: string
    status: BookingStatus
    notes: string | null
    gcal_event_id: string | null
    created_at: string
    updated_at: string
}

export interface GoogleCalendarToken {
    id: string
    access_token: string
    refresh_token: string
    expires_at: string
    calendar_id: string | null
    created_at: string
    updated_at: string
}

// Tipos para inserciones (sin campos auto-generados)
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
export type SalonConfigInsert = Omit<SalonConfig, 'id' | 'created_at' | 'updated_at'>
export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'>
export type ScheduleInsert = Omit<Schedule, 'id' | 'created_at' | 'updated_at'>
export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'>
export type GoogleCalendarTokenInsert = Omit<GoogleCalendarToken, 'id' | 'created_at' | 'updated_at'>

// Tipos para actualizaciones (todos los campos opcionales)
export type ProfileUpdate = Partial<ProfileInsert>
export type SalonConfigUpdate = Partial<SalonConfigInsert>
export type ServiceUpdate = Partial<ServiceInsert>
export type ScheduleUpdate = Partial<ScheduleInsert>
export type BookingUpdate = Partial<BookingInsert>
export type GoogleCalendarTokenUpdate = Partial<GoogleCalendarTokenInsert>

// Definición completa de la base de datos para Supabase
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: ProfileInsert
                Update: ProfileUpdate
            }
            salon_config: {
                Row: SalonConfig
                Insert: SalonConfigInsert
                Update: SalonConfigUpdate
            }
            services: {
                Row: Service
                Insert: ServiceInsert
                Update: ServiceUpdate
            }
            schedules: {
                Row: Schedule
                Insert: ScheduleInsert
                Update: ScheduleUpdate
            }
            bookings: {
                Row: Booking
                Insert: BookingInsert
                Update: BookingUpdate
            }
            google_calendar_tokens: {
                Row: GoogleCalendarToken
                Insert: GoogleCalendarTokenInsert
                Update: GoogleCalendarTokenUpdate
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            is_admin: {
                Args: Record<string, never>
                Returns: boolean
            }
        }
        Enums: {
            user_role: UserRole
            booking_status: BookingStatus
        }
    }
}
