import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { authClient } from '@/lib/auth.ts'
import {ChatLayout} from "@/components/chat/chat-layout.tsx";
import {Button} from "@/components/ui/button.tsx";
import {IconLoader2} from "@tabler/icons-react";

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

    if (!data){
        return (
          <div className="h-screen w-full flex flex-col items-center justify-center">
              <div>
                  <p>No data found!</p>
                  <IconLoader2 className="animate-spin" />
              </div>
          </div>
        )
    }

    return (
        <div className="h-screen overflow-hidden w-full">
            <ChatLayout className="flex flex-col items-center justify-center">
                <h1>Dashboard</h1>
                <p>Welcome back {data?.user.name}</p>
                <p>This account is associated with {data?.user.email}</p>
                <Button onClick={() => handleSignOut()}>Sign out</Button>
            </ChatLayout>
        </div>
    )
}