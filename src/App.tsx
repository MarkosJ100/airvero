import { ToastProvider } from '@/context/ToastContext'
import { AppRouter } from '@/routes'

function App() {
    return (
        <ToastProvider>
            <AppRouter />
        </ToastProvider>
    )
}

export default App
