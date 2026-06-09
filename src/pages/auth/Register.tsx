import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sunflower/20 text-4xl">
          🌻
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Elevia</h1>
        <p className="mt-1 font-body text-sm text-muted-foreground">Começa o teu crescimento hoje.</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-6 font-display text-xl font-semibold text-foreground">Criar conta</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="O teu nome"
              autoComplete="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
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
            {loading ? 'A criar conta…' : 'Criar conta'}
          </Button>
        </form>

      </div>

      <p className="mt-6 font-body text-sm text-muted-foreground">
        Já tens conta?{' '}
        <Link to="/login" className="font-medium text-sunflower-dark hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}

