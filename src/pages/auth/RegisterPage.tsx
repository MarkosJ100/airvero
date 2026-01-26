import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card } from '@/components/ui'

export function RegisterPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        role: 'cliente' // Por defecto
                    }
                }
            })

            if (error) throw error

            if (data.user) {
                // Supabase puede requerir confirmación de email
                alert('Registro exitoso. Por favor verifica tu correo electrónico si es necesario.')
                navigate('/login')
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrarse')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2>Crear Cuenta</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Regístrate para reservar citas
                </p>
            </div>

            <form onSubmit={handleRegister}>
                <Input
                    label="Nombre Completo"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    required
                />

                <Input
                    label="Correo Electrónico"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                />

                <Input
                    label="Teléfono"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+34 600 000 000"
                />

                <Input
                    label="Contraseña"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                />

                <Input
                    label="Confirmar Contraseña"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                />

                {error && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <Button type="submit" isLoading={loading} fullWidth>
                    Registrarse
                </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                    Inicia sesión aquí
                </Link>
            </div>
        </Card>
    )
}
