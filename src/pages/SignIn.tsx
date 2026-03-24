import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router'
import {authClient} from '../utils/auth'

export function SignIn() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [method, setMethod] = useState<"signIn" | "signUp">('signIn')
    const navigate = useNavigate()

    useEffect(() => {
        fetch('http://localhost:3000/api/me', {credentials: 'include'})
            .then(res => res.json())
            .then(session => {
                if (session) {
                    navigate('/dashboard')
                }
            })
    }, []);

    async function handleSubmit(e: { preventDefault: () => void }) {
        e.preventDefault()
        setError('')
        setLoading(true)
        const {data, error} = method === "signIn" ? await authClient.signIn.email({
            email,
            password
        }) : await authClient.signUp.email({email, password, name: "USER1"})
        setLoading(false)
        if (error) {
            setError(error.message || 'Sign in failed')
        } else if (data) {
            navigate('/dashboard')
        }
    }

    return (
        <div className="h-screen w-full flex flex-col justify-center items-center bg-gray-50">
            <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
                <h1 className="text-2xl font-bold mb-6 text-center">{method === "signIn" ? "Sign in" : "Sing up"}</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white rounded px-4 py-2 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing in...' : method === "signIn" ? "Sign in" : "Sing up"}
                    </button>
                </form>
                <div className="w-full text-center mt-4">
                    <button
                        onClick={() => setMethod(method === "signIn" ? "signUp" : "signIn")}>{method === "signIn" ? "Sign up?" : "Sing in?"}</button>
                </div>
            </div>
        </div>
    )
}