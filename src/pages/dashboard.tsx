import {useEffect, useState} from 'react'
import {ChatLayout} from "@/components/chat/chat-layout.tsx";
import {IconLoader2} from "@tabler/icons-react";
import {Navbar} from "@/components/navigation/navbar.tsx";
import type {User} from "better-auth";
import {FileExplorer} from "@/components/files/file-explorer.tsx";

interface DashboardData {
  message: string
  user: User
}

export function DashboardPage() {
  const [session, setSession] = useState<DashboardData | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dashboard`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        setSession(data)
        setSessionLoading(false)
      })
  }, [])

  if (sessionLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <IconLoader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No session found.</p>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden w-full">
      <ChatLayout>
        <Navbar user={session.user} />
        <FileExplorer />
      </ChatLayout>
    </div>
  )
}