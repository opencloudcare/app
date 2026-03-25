import {type ReactNode, useEffect, useState} from 'react'
import { Navigate } from 'react-router'

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, { credentials: 'include' })
            .then(res => res.json())
            .then(session => {
                setStatus(session ? 'authenticated' : 'unauthenticated')
            })
            .catch(() => setStatus('unauthenticated'))
    }, [])

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex justify-center items-center">
                <p className="text-gray-400">Checking session...</p>
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/sign-in" replace />
    }

    return <>{children}</>
}