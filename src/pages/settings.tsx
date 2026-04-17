import {Separator} from "@/components/ui/separator.tsx"
import {PersonalSection} from "@/components/settings/personal-section.tsx";
import {AccountSecurity} from "@/components/settings/account-security.tsx";
import {AiPreferences} from "@/components/settings/ai-preferences.tsx";

export default function SettingsPage() {


  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-10">

        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences.</p>
        </div>
        <Separator/>
        <PersonalSection/>
        <Separator/>
        <AiPreferences />
        <Separator/>
        <AccountSecurity />
        <div className="pb-4"/>
      </div>
    </div>
  )
}
