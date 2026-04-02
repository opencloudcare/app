import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {LogOutIcon, SettingsIcon, UserIcon} from "lucide-react";
import {authClient} from "@/lib/auth.ts";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {User} from "better-auth";
import {Button} from "@/components/ui/button.tsx";

const AVATAR_GRADIENTS = [
  'radial-gradient(circle at 70% 70%, #c026d3, #6366f1 45%, #3730a3)',
  'radial-gradient(circle at 70% 70%, #f97316, #ef4444 45%, #991b1b)',
  'radial-gradient(circle at 70% 70%, #06b6d4, #3b82f6 45%, #1e3a8a)',
  'radial-gradient(circle at 70% 70%, #a3e635, #10b981 45%, #065f46)',
  'radial-gradient(circle at 70% 70%, #f472b6, #a855f7 45%, #581c87)',
  'radial-gradient(circle at 70% 70%, #fb923c, #f59e0b 45%, #78350f)',
  'radial-gradient(circle at 70% 70%, #34d399, #06b6d4 45%, #164e63)',
  'radial-gradient(circle at 70% 70%, #818cf8, #3b82f6 45%, #1e3a8a)',
];

function getAvatarGradient(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

export const Navbar = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        setUser(data.user)
      })
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    // remove items in the local storage
    localStorage.removeItem("conversationId")
    localStorage.removeItem("conversationTitle")
    navigate('/sign-in')
  }

  if (!user) return null;

  return (
    <nav className="w-full px-3 py-3 inline-flex items-center justify-between">
      <span onClick={() => navigate("/dashboard")} className="cursor-pointer font-semibold tracking-tight" aria-label="link">OpenCare</span>
      <div className="ml-auto w-fit">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              {/* TODO: add profile picture support */}
              <AvatarImage></AvatarImage>
              <AvatarFallback style={{ background: getAvatarGradient(user.name) }}>
                <span className="text-white font-medium text-sm uppercase">{user.name[0]}{user.name.split(" ")[1][0]}</span>
              </AvatarFallback>
            </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserIcon/>
              Profile
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

  );
};
