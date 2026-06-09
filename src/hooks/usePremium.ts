import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useUpgradeToPremium() {
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    if (!session) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ origin: window.location.origin }),
        }
      )
      const data = await res.json()
      if (data.error === 'already_premium') {
        setError('Já és Premium!')
        return
      }
      if (data.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar checkout')
    } finally {
      setIsLoading(false)
    }
  }

  return { startCheckout, isLoading, error }
}
