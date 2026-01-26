import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
    appId: 'com.airvero.app',
    appName: 'AIRVERO',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
    android: {
        backgroundColor: '#FFFFFF',
    },
}

export default config
