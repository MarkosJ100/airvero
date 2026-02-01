import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export function LoginPage() {
    const navigate = useNavigate()
    const { session } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Si ya hay sesión, redirigir
    if (session) {
        navigate('/admin/dashboard')
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.user) {
                // Verificar rol para redirección inteligente
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', data.user.id)
                    .single()

                const userRole = (profile as any)?.role

                if (userRole === 'admin') {
                    navigate('/admin/dashboard')
                } else {
                    navigate('/client/reservar')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                    }}>
                        💇‍♀️
                    </div>
                    <h1 className="login-title" style={{ fontSize: '1.75rem', fontWeight: 700 }}>AIRVERO</h1>
                    <p className="login-subtitle">Gestión de Peluquería</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            style={{ fontSize: '16px' }} // Prevents iOS zoom
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(220, 53, 69, 0.1)',
                            color: 'var(--color-error)',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            ❌ {error}
                        </div>
                    )}

                    <Button type="submit" isLoading={loading} fullWidth style={{ marginTop: '0.5rem' }}>
                        Iniciar Sesión
                    </Button>
                </form>

                <div style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-secondary)'
                }}>
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    )
}
