import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppRouter } from '@/routes'

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppRouter />
            </ToastProvider>
        </AuthProvider>
    )
}

export default App
