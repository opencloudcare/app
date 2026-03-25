import { BrowserRouter, Routes, Route } from 'react-router'
import { SignInPage } from '@/pages/sign-in'
import { ProtectedRoute } from '@/components/auth/protected-route.tsx'
import {DashboardPage} from "@/pages/dashboard.tsx";
import {NotFoundPage} from "@/pages/not-found.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/sign-in" element={<SignInPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
