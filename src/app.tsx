import {BrowserRouter, Route, Routes} from 'react-router'
import {SignInPage} from '@/pages/sign-in'
import {ProtectedRoute} from '@/components/auth/protected-route.tsx'
import {DashboardPage} from "@/pages/dashboard.tsx"
import {DatabasePage} from "@/pages/database.tsx"
import {AccountPage} from "@/pages/account.tsx"
import {NotFoundPage} from "@/pages/not-found.tsx"
import SettingsPage from "@/pages/settings.tsx"
import {ToolBar} from "@/components/ui/tool-bar.tsx"
import {Navbar} from "@/components/navigation/navbar.tsx"

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ToolBar>
        <Navbar />
        {children}
      </ToolBar>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage/>}/>
        <Route path="/dashboard" element={<Protected><DashboardPage/></Protected>}/>
        <Route path="/database"  element={<Protected><DatabasePage/></Protected>}/>
        <Route path="/account"   element={<Protected><AccountPage/></Protected>}/>
        <Route path="/settings"  element={<Protected><SettingsPage/></Protected>}/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
