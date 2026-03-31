import {BrowserRouter, Route, Routes} from 'react-router'
import {SignInPage} from '@/pages/sign-in'
import {ProtectedRoute} from '@/components/auth/protected-route.tsx'
import {DashboardPage} from "@/pages/dashboard.tsx";
import {NotFoundPage} from "@/pages/not-found.tsx";
import SettingsPage from "@/pages/settings.tsx";
import {ToolBar} from "@/components/ui/tool-bar.tsx";
import {Navbar} from "@/components/navigation/navbar.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage/>}/>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ToolBar>
                <Navbar/>
                <DashboardPage/>
              </ToolBar>
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={
          <ProtectedRoute>
            <ToolBar>
              <Navbar/>
              <SettingsPage/>
            </ToolBar>
          </ProtectedRoute>
        }/>
        <Route path="*" element={<NotFoundPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
