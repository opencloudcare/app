import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { authClient } from '@/lib/auth.ts'

interface DashboardData {
    message: string
    user: { id: string; email: string; name: string }
}

export function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, { credentials: 'include' })
            .then(res => res.json())
            .then(setData)
    }, [])

    async function handleSignOut() {
        await authClient.signOut()
        navigate('/sign-in')
    }

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center bg-gray-50 gap-6">
            <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm text-center flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-500 text-sm">Protected page — authenticated users only</p>
                {data && (
                    <div className="bg-gray-100 rounded p-3 text-left text-sm">
                        <p className="font-medium">{data.user.name || 'No name set'}</p>
                        <p className="text-gray-500">{data.user.email}</p>
                    </div>
                )}
                <p className="text-gray-700">{data?.message}</p>
                <button
                    onClick={handleSignOut}
                    className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}