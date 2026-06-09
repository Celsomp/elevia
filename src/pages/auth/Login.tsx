import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      {/* Logo / brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sunflower/20 text-4xl">
          🌻
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Elevia</h1>
        <p className="mt-1 font-body text-sm text-muted-foreground">O teu crescimento, dia a dia.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-6 font-display text-xl font-semibold text-foreground">Entrar</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@exemplo.com"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/reset-password"
                className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceste-te?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>

      </div>

      <p className="mt-6 font-body text-sm text-muted-foreground">
        Ainda não tens conta?{' '}
        <Link to="/register" className="font-medium text-sunflower-dark hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

