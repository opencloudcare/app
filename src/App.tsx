import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { SignIn } from './pages/SignIn'
import { Dashboard } from './pages/Dashboard'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/sign-in" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
