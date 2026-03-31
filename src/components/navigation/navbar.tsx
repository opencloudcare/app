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
    navigate('/sign-in')
  }

  if (!user) return null;

  return (
    <nav className="w-full px-3 py-3">
      <div className="ml-auto w-fit">
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <Avatar>
              {/* TODO: add profile picture support */}
              <AvatarImage></AvatarImage>
              <AvatarFallback className="bg-linear-to-br from-blue-300 to-indigo-400">
                <span className="text-white uppercase">{user.name[0]}{user.name.split(" ")[1][0]}</span>
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <UserIcon/>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
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
