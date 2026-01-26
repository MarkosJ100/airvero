/**
 * Servicio para integración con Google Calendar API (Client-side)
 * 
 * Requiere:
 * 1. Google Cloud Project
 * 2. OAuth Client ID
 * 3. Calendar API enabled
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

// Cargar script de Google Identity Services
export const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts) return resolve(true)

        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('Error cargando Google API'))
        document.body.appendChild(script)
    })
}

// Inicializar y solicitar token (Implicit Flow para demo, Code Flow recomendado para prod)
export const requestGoogleToken = (loginHint?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!window.google) return reject('Google API no cargada')

        const config: any = {
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
                if (response.access_token) {
                    resolve(response.access_token)
                } else {
                    reject(response)
                }
            },
        }

        // Si hay un hint de email, usarlo para preseleccionar la cuenta
        if (loginHint) {
            config.hint = loginHint
        }

        const client = window.google.accounts.oauth2.initTokenClient(config)
        client.requestAccessToken()
    })
}

// Crear evento en calendario
export const createGoogleEvent = async (accessToken: string, eventDetails: any) => {
    try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventDetails)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Error creando evento')
        }

        return await response.json()
    } catch (error) {
        console.error('API Error:', error)
        throw error
    }
}
