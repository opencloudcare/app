import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"
import {LogOutIcon, SettingsIcon, UserIcon} from "lucide-react"
import {authClient, type User} from "@/lib/auth.ts"
import {useNavigate, useLocation} from "react-router"
import {useEffect, useState} from "react"
import {Button} from "@/components/ui/button.tsx"
import {ModeToggle} from "@/components/ui/mode-toggle.tsx"
import {clearLocalStorage} from "@/components/auth/clear-local-storage.ts"
import {cn} from "@/lib/utils.ts"

const AVATAR_GRADIENTS = [
  'radial-gradient(circle at 70% 70%, #c026d3, #6366f1 45%, #3730a3)',
  'radial-gradient(circle at 70% 70%, #f97316, #ef4444 45%, #991b1b)',
  'radial-gradient(circle at 70% 70%, #06b6d4, #3b82f6 45%, #1e3a8a)',
  'radial-gradient(circle at 70% 70%, #a3e635, #10b981 45%, #065f46)',
  'radial-gradient(circle at 70% 70%, #f472b6, #a855f7 45%, #581c87)',
  'radial-gradient(circle at 70% 70%, #fb923c, #f59e0b 45%, #78350f)',
  'radial-gradient(circle at 70% 70%, #34d399, #06b6d4 45%, #164e63)',
  'radial-gradient(circle at 70% 70%, #818cf8, #3b82f6 45%, #1e3a8a)',
]

export function getAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[index]
}

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/database",  label: "Database"  },
]

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => setUser(data.user))
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    clearLocalStorage()
    navigate('/sign-in')
  }

  if (!user) return null

  return (
    <nav className="w-full px-3 py-3 inline-flex items-center justify-between">
      <span
        onClick={() => navigate("/dashboard")}
        className="cursor-pointer font-semibold tracking-tight shrink-0"
        aria-label="link"
      >
        OpenCare
      </span>

      {/* Nav links */}
      <div className="flex items-center gap-0.5 mx-4">
        {NAV_LINKS.map(({ to, label }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all cursor-pointer",
              location.pathname === to
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ml-auto w-fit inline-flex gap-4 items-center">
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={user.image as string} className="object-cover aspect-square" referrerPolicy="no-referrer" />
                <AvatarFallback style={{ background: getAvatarGradient(user.name ?? user.email) }}>
                  <span className="text-white font-medium text-sm uppercase">{user?.firstName[0] ?? ""}{user?.lastName[0] ?? ""}</span>
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => navigate("/account")}>
              <UserIcon/>
              Health Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <SettingsIcon/>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem onClick={() => handleSignOut()} variant="destructive">
              <LogOutIcon/>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
