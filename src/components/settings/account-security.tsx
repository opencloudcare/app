import {Input} from "@/components/ui/input.tsx"
import {Button} from "@/components/ui/button.tsx"
import {FieldRow} from "@/components/ui/field-row.tsx";
import {DeleteAccount} from "@/components/settings/delete-account.tsx";
import {DeleteConversations} from "@/components/settings/delete-conversations.tsx";
import {SectionHeader} from "@/components/ui/section-header.tsx";
import {
  IconBrandGithub,
  IconBrandGoogleFilled,
  IconCheck,
  IconLoader2,
  IconShieldLock
} from "@tabler/icons-react";
import {Separator} from "@/components/ui/separator.tsx";
import {authClient} from "@/lib/auth.ts";
import {useEffect, useState} from "react";

export const AccountSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{providerId: string}[]>([])

  const handleLinkAccount = async () => {
    setLoading(true);
    const res = await authClient.linkSocial({
      provider: "google",
      callbackURL: window.location.href,
      errorCallbackURL: window.location.href,
    });

    console.log(res)
    setLoading(false);
  }

  const getCredentials = async (userId: string) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/connections/${userId}`, {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) {
      console.log(await response.text())
      return
    }
    const credentials = await response.json()
    setCredentials(credentials.data)
  }

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (!session?.data?.user) return
      getCredentials(session.data.user.id)
    })
  },[])

  return (
    <section>
      <SectionHeader
        icon={<IconShieldLock size={16} className="text-muted-foreground"/>}
        title="Account & Security"
        description="Password, connected accounts, and data management."
      />
      <div className="space-y-3">

        {/* Connected accounts */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Connected accounts</p>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBrandGoogleFilled size={18}/>
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">{credentials.some(c => c.providerId === "google") ? "Connected" : "Not connected"}</p>
              </div>
            </div>
            {credentials.some(c => c.providerId === "google") ? (
              <IconCheck size={16} className="text-emerald-500" />
              ):(
              <Button size="sm" variant="outline" disabled={loading} onClick={handleLinkAccount}>
                {loading ?
                  <IconLoader2 className="animate-spin"/> : "Connect"}
              </Button>
            )}
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconBrandGithub size={18}/>
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button size="sm" variant="outline" disabled>Connect</Button>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Change password</p>
          <FieldRow label="Current password">
            <Input type="password" placeholder="••••••••"/>
          </FieldRow>
          <FieldRow label="New password">
            <Input type="password" placeholder="••••••••"/>
          </FieldRow>
          <div className="flex justify-end pt-1">
            <Button size="sm" disabled>Update password</Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 space-y-3">
          <p className="text-xs font-medium text-destructive/80 uppercase tracking-wider">Danger zone</p>
          <DeleteConversations/>
          <Separator/>
          <DeleteAccount/>
        </div>
      </div>
    </section>
  );
};
