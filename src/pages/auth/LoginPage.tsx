import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card } from '@/components/ui'
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
        // La redirección inteligente se podría mejorar chequeando el rol,
        // pero por defecto protected route lo manejará o el usuario navegará.
        // Lo dejaremos simple: navigate('/')
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
        <Card>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2>Iniciar Sesión</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Bienvenido a AIRVERO
                </p>
            </div>

            <form onSubmit={handleLogin}>
                <Input
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                />

                <Input
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />

                {error && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <Button type="submit" isLoading={loading} fullWidth>
                    Entrar
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                    Regístrate aquí
                </Link>
            </div>
        </Card>
    )
}
