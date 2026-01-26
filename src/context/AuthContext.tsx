import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    loading: boolean
    isAdmin: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        // 1. Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                checkUserRole(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // 2. Escuchar cambios de sesión
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                checkUserRole(session.user.id)
            } else {
                setIsAdmin(false)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function checkUserRole(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', userId)
                .single()

            if (error) throw error
            const profile = data as { role: 'admin' | 'cliente' } | null
            setIsAdmin(profile?.role === 'admin')
        } catch (error) {
            console.error('Error checking role:', error)
            setIsAdmin(false)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        // Estado se actualiza vía onAuthStateChange
    }

    return (
        <AuthContext.Provider value={{ session, user, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
