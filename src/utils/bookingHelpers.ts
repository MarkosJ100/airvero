import type { Booking } from '@/types/database.types'

/**
 * Convierte una hora en formato "HH:mm" a minutos desde medianoche
 * Ejemplo: "10:30" -> 630
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Convierte minutos desde medianoche a formato "HH:mm"
 * Ejemplo: 630 -> "10:30"
 */
export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calcula el próximo slot de tiempo disponible para una reserva
 */
export function calcularProximoSlotDisponible(
    fecha: string,
    duracionMinutos: number,
    reservasExistentes: Booking[],
    horarioInicio: string = '09:00',
    horarioFin: string = '20:00'
): string | null {
    const inicioSalon = timeToMinutes(horarioInicio)
    const finSalon = timeToMinutes(horarioFin)

    // Obtener hora actual si es hoy
    const hoy = new Date().toISOString().split('T')[0]
    const esHoy = fecha === hoy
    const ahoraMinutos = esHoy ? new Date().getHours() * 60 + new Date().getMinutes() : 0

    // Punto de inicio: max entre ahora, inicio del salón
    let inicioBusqueda = Math.max(ahoraMinutos, inicioSalon)

    // Redondear al siguiente intervalo de 15 minutos
    inicioBusqueda = Math.ceil(inicioBusqueda / 15) * 15

    // Convertir reservas a slots ocupados y ordenar
    const slotsOcupados = reservasExistentes
        .filter(r => r.booking_date === fecha)
        .map(r => ({
            inicio: timeToMinutes(r.start_time),
            fin: timeToMinutes(r.end_time)
        }))
        .sort((a, b) => a.inicio - b.inicio)

    // Buscar primer gap disponible
    let horaCandidato = inicioBusqueda

    while (horaCandidato + duracionMinutos <= finSalon) {
        const finCandidato = horaCandidato + duracionMinutos

        // Verificar si este slot se solapa con alguna reserva
        const haySolape = slotsOcupados.some(slot => {
            // Hay solape si:
            // - El inicio está dentro de una reserva existente
            // - El fin está dentro de una reserva existente
            // - El slot envuelve completamente a una reserva existente
            return (
                (horaCandidato < slot.fin && finCandidato > slot.inicio)
            )
        })

        if (!haySolape) {
            // ¡Encontramos un slot disponible!
            return minutesToTime(horaCandidato)
        }

        // Si hay solape, saltar al final de la reserva que bloquea
        const reservaBloqueante = slotsOcupados.find(slot =>
            horaCandidato < slot.fin && finCandidato > slot.inicio
        )

        if (reservaBloqueante) {
            horaCandidato = reservaBloqueante.fin
            // Redondear al siguiente intervalo de 15 minutos
            horaCandidato = Math.ceil(horaCandidato / 15) * 15
        } else {
            // Avanzar 15 minutos
            horaCandidato += 15
        }
    }

    // No hay slots disponibles
    return null
}

/**
 * Valida si una nueva reserva entra en conflicto con reservas existentes
 */
export function validarConflictoReservas(
    fecha: string,
    horaInicio: string,
    duracionMinutos: number,
    reservasExistentes: Booking[],
    reservaEditandoId?: string
): { hayConflicto: boolean; reservaConflicto?: Booking } {
    const inicioMinutos = timeToMinutes(horaInicio)
    const finMinutos = inicioMinutos + duracionMinutos

    const reservasDelDia = reservasExistentes.filter(r =>
        r.booking_date === fecha && r.id !== reservaEditandoId
    )

    for (const reserva of reservasDelDia) {
        const reservaInicio = timeToMinutes(reserva.start_time)
        const reservaFin = timeToMinutes(reserva.end_time)

        // Verificar solape
        if (inicioMinutos < reservaFin && finMinutos > reservaInicio) {
            return {
                hayConflicto: true,
                reservaConflicto: reserva
            }
        }
    }

    return { hayConflicto: false }
}

/**
 * Calcula la hora de fin basándose en hora de inicio y duración
 */
export function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
    const inicioMinutos = timeToMinutes(horaInicio)
    const finMinutos = inicioMinutos + duracionMinutos
    return minutesToTime(finMinutos)
}

/**
 * Obtiene múltiples slots disponibles (para mostrar alternativas)
 */
export function obtenerSlotsDisponibles(
    fecha: string,
    duracionMinutos: number,
    reservasExistentes: Booking[],
    cantidad: number = 5,
    horarioInicio: string = '09:00',
    horarioFin: string = '20:00'
): string[] {
    const slots: string[] = []
    const inicioSalon = timeToMinutes(horarioInicio)
    const finSalon = timeToMinutes(horarioFin)

    let horaCandidato = inicioSalon

    const slotsOcupados = reservasExistentes
        .filter(r => r.booking_date === fecha)
        .map(r => ({
            inicio: timeToMinutes(r.start_time),
            fin: timeToMinutes(r.end_time)
        }))
        .sort((a, b) => a.inicio - b.inicio)

    while (slots.length < cantidad && horaCandidato + duracionMinutos <= finSalon) {
        const finCandidato = horaCandidato + duracionMinutos

        const haySolape = slotsOcupados.some(slot =>
            horaCandidato < slot.fin && finCandidato > slot.inicio
        )

        if (!haySolape) {
            slots.push(minutesToTime(horaCandidato))
            horaCandidato += duracionMinutos // Siguiente slot después de este
        } else {
            const reservaBloqueante = slotsOcupados.find(slot =>
                horaCandidato < slot.fin && finCandidato > slot.inicio
            )
            if (reservaBloqueante) {
                horaCandidato = reservaBloqueante.fin
            } else {
                horaCandidato += 15
            }
        }
    }

    return slots
}
