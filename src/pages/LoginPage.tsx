import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { API_BASE_URL } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { FormField } from '@/components/FormField'
import { PrimaryButton, OutlineButton } from '@/components/Buttons'
import { AlertCircle } from 'lucide-react'

// Icon from screenshot (Wt Kit Logo)
const Logo = () => (
  <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-[#4a7c59] text-white shadow-sm mb-6">
    <div className="relative font-bold leading-none text-2xl tracking-tighter">
      <span>W</span>
      <span className="text-xl">k</span>
      <div className="absolute -top-1 -right-4 text-xs font-semibold">it</div>
    </div>
  </div>
)

export default function LoginPage() {
  const { login } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // Handle OAuth2 redirect query param
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Clear the query parameter from the URL for security/cleanliness
      searchParams.delete('token')
      setSearchParams(searchParams, { replace: true })
      login(token) // This saves token and redirects to Dashboard
    }
  }, [searchParams, setSearchParams, login])

  // React Query mutation for Login
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials. Please verify your username and password.')
      }

      const data = await response.json()
      return data.token as string
    },
    onSuccess: (token) => {
      login(token) // Context handles localStorage & redirect
    },
    onError: (error: Error) => {
      setAuthError(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    if (!username || !password) {
      setAuthError('Username and password are required.')
      return
    }

    loginMutation.mutate()
  }

  const handleGoogleLogin = () => {
    // Redirect browser directly to the remote OAuth2 endpoint.
    // We cannot use the local Vite proxy for this because the OAuth flow requires
    // the backend's real domain for Google's callback.
    window.location.href = `https://spotty-con-ivaniks-3f8c7802.koyeb.app/api/auth/login/oauth2/google`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
      {/* Branding Header */}
      <div className="flex flex-col items-center justify-center mb-8">
        <Logo />
        <h1 className="text-2xl font-bold text-gray-900">Wellness Kit Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage delivery orders</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <FormField
              label="Username"
              placeholder="admin@wellnesskit.com" // using email as placeholder since it was like that in screenshot
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loginMutation.isPending}
            />

            {/* Email field — UX only, unused in auth currently (following instructions to match UI) */}
            <FormField
              label="Email"
              type="email"
              placeholder="admin@wellnesskit.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginMutation.isPending}
            />

            <FormField
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </div>

          {/* Validation/API Errors */}
          {authError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{authError}</p>
            </div>
          )}

          {/* Submit Button */}
          <PrimaryButton
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full mt-2 py-2.5"
          >
            {loginMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                Logging in…
              </span>
            ) : (
              'Log in'
            )}
          </PrimaryButton>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google SSO Button */}
          <OutlineButton
            type="button"
            onClick={handleGoogleLogin}
            disabled={loginMutation.isPending}
            className="w-full relative py-2.5"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            Sign in with Google
          </OutlineButton>
        </form>
      </div>
    </div>
  )
}
