import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {getAvatarGradient} from "@/components/navigation/navbar.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {
  IconCheck,
  IconMail,
  IconPencil,
  IconRosetteDiscountCheck,
  IconRosetteDiscountCheckOff,
} from "@tabler/icons-react";
import {authClient, type User} from "@/lib/auth.ts";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {InputPlus} from "@/components/ui/input-plus.tsx";
import {FieldRow} from "@/components/ui/field-row.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";

export const PersonalSection = () => {
  const [user, setUser] = useState<User | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [editEmail, setEditEmail] = useState<boolean>(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {credentials: "include"})
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user)
        setFirstName(data.user.firstName ?? "")
        setLastName(data.user.lastName ?? "")
        setEmail(data.user?.email ?? "")
      })
  }, [])

  if (!user) return null;

  const updateFirstName = async () => {
    return await authClient.updateUser({
      firstName: firstName,
      name: `${firstName} ${lastName}`,
    });
  }

  const updateLastName = async () => {
    return await authClient.updateUser({
      lastName: lastName,
      name: `${firstName} ${lastName}`,
    })
  }

  const updateEmail = async () => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/update/email`, {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email})
    })
    if (!response.ok) {
      setEditEmail(false)
      setEmail(user.email)
      console.log(response.text())
    }
    return response.ok;
  }
  return (
    <section>
      <div className="space-y-4">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={user.image as string} className="object-cover aspect-square" />
            <AvatarFallback
              className="flex items-center justify-center text-white text-2xl font-semibold select-none shrink-0"
              style={{background: getAvatarGradient(user.name)}}>
              {(firstName[0] ?? "").toUpperCase()}{(lastName[0] ?? "").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled>Update Avatar</Button>
              <button
                className="text-xs text-blue-500 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                disabled>Clear
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Recommend size 1:1, up to 2mb</p>
          </div>
        </div>

        {/* Name row */}
        <div className="flex gap-3">
          <FieldRow label="First name" className="w-full">
            <InputPlus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              processFunction={updateFirstName}
              className="w-full"
              placeholder="First name"
              indicator={<IconCheck size={14} className="text-emerald-500"/>}
            />
          </FieldRow>
          <FieldRow label="Last name" className="w-full">
            <InputPlus
              value={lastName}
              processFunction={updateLastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full"
              placeholder="Last name"
              indicator={<IconCheck size={14} className="text-emerald-500"/>}
            />
          </FieldRow>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5 mt-10">
          <div className="inline-flex items-center gap-6">
            <label className="text-xs font-medium text-muted-foreground">Email address</label>
          </div>
          <InputPlus
            style={{display: editEmail ? "inline-flex" : "none"}}
            value={email}
            onEscape={() => setEditEmail(false)}
            processFunction={updateEmail}
            callbackFunction={() => setEditEmail(false)}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            indicator={<IconCheck size={14} className="text-emerald-500"/>}
          />
          <div className="inline-flex items-center justify-start gap-1"
               style={{display: editEmail ? "none" : "flex"}}>
            <IconMail size={16} className="text-muted-foreground"/>
            <span className="text-sm px-3 py-2 text-muted-foreground">{email}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="cursor-pointer">
                  <IconPencil size={14}/>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-transparent">
                    <IconMail/>
                  </AlertDialogMedia>
                  <AlertDialogTitle className="font-semibold tracking-tight">Change email?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to change <span className="text-foreground font-medium">{email}</span>. You will need
                    to verify the new address before the change takes effect.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setEditEmail(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setEditEmail(true)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {user.emailVerified ? (
              <Tooltip>
                <TooltipTrigger>
                  <IconRosetteDiscountCheck size={18} className="text-emerald-500"/>
                </TooltipTrigger>
                <TooltipContent>
                  Email verified
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <IconRosetteDiscountCheckOff size={18} className="text-red-500"/>
                </TooltipTrigger>
                <TooltipContent>
                  Email not verified
                </TooltipContent>
              </Tooltip>
            )}
            <span
              className="text-xs ml-auto px-3 py-2 text-muted-foreground italic">Added on {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
