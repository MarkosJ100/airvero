/**
 * WhatsApp Deep Link Generator
 * Genera enlaces para abrir WhatsApp con mensajes prellenados
 */

/**
 * Genera un enlace de WhatsApp con mensaje prellenado
 * @param phone - Número de teléfono (formato internacional sin +)
 * @param message - Mensaje a prellenar
 * @returns URL de WhatsApp
 */
export function generateWhatsAppLink(phone: string, message: string): string {
    // Limpiar teléfono (quitar espacios, guiones, etc.)
    const cleanPhone = phone.replace(/[^\d]/g, '')

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message)

    // Generar link (funciona en web y móvil)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Genera mensaje de confirmación de cita
 * @param nombre - Nombre del cliente
 * @param fecha - Fecha de la cita (formato legible: "28 de enero")
 * @param hora - Hora de la cita (formato: "10:00")
 * @returns Mensaje formateado
 */
export function formatConfirmationMessage(
    nombre: string,
    fecha: string,
    hora: string
): string {
    return `Hola ${nombre} 😊
Te confirmo tu cita el ${fecha} a las ${hora}.
Cualquier cosa me dices 💇‍♀️✨`
}

/**
 * Genera mensaje de recordatorio de cita
 * @param nombre - Nombre del cliente
 * @param hora - Hora de la cita
 * @returns Mensaje formateado
 */
export function formatReminderMessage(nombre: string, hora: string): string {
    return `Hola ${nombre}, te recuerdo tu cita mañana a las ${hora} 💖
¡Te espero!`
}

/**
 * Genera mensaje de cancelación
 * @param nombre - Nombre del cliente
 * @param fecha - Fecha de la cita cancelada
 * @returns Mensaje formateado
 */
export function formatCancellationMessage(nombre: string, fecha: string): string {
    return `Hola ${nombre}, tu cita del ${fecha} ha sido cancelada.
Si quieres reagendar, dime sin problema 😊`
}

/**
 * Genera mensaje genérico para contactar cliente
 * @param nombre - Nombre del cliente
 * @returns Mensaje formateado
 */
export function formatGenericMessage(nombre: string): string {
    return `Hola ${nombre} 😊`
}

/**
 * Formatea fecha a texto legible en español
 * @param date - Fecha a formatear
 * @returns Fecha formateada (ej: "28 de enero")
 */
export function formatDateSpanish(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]

    const day = dateObj.getDate()
    const month = months[dateObj.getMonth()]

    return `${day} de ${month}`
}

/**
 * Formatea hora a formato HH:MM
 * @param time - Hora en formato TIME o string
 * @returns Hora formateada (ej: "10:00")
 */
export function formatTime(time: string): string {
    // Si ya viene en formato HH:MM:SS, extraer solo HH:MM
    if (time.includes(':')) {
        const parts = time.split(':')
        return `${parts[0]}:${parts[1]}`
    }
    return time
}
