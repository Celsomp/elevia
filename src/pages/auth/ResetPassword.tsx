import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sunflower/20 text-4xl">
          🌻
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Elevia</h1>
      </div>

      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        {sent ? (
          <div className="text-center">
            <div className="mb-3 text-3xl">📬</div>
            <h2 className="font-display text-xl font-semibold text-foreground">Verifica o teu email</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Enviámos um link para <strong>{email}</strong>. Segue as instruções para redefinir a tua password.
            </p>
            <Link to="/login" className="mt-4 inline-block font-body text-sm font-medium text-sunflower-dark hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="mb-2 font-display text-xl font-semibold text-foreground">Recuperar password</h2>
            <p className="mb-6 font-body text-sm text-muted-foreground">
              Introduz o teu email e enviamos um link para redefinir a password.
            </p>

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

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading}>
                {loading ? 'A enviar…' : 'Enviar link'}
              </Button>
            </form>
          </>
        )}
      </div>

      {!sent && (
        <p className="mt-6 font-body text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-sunflower-dark hover:underline">
            Voltar ao login
          </Link>
        </p>
      )}
    </div>
  )
}
