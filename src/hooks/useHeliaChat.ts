import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  created_at?: string
}

export const FREE_DAILY_LIMIT = 5

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `Olá! Sou a Helia, a tua companheira de crescimento. 🌻\n\nEstou aqui para te ouvir, ajudar a reflectir e celebrar cada pequeno passo. Em que é que te posso ajudar hoje?`,
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useDailyMessageCount() {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  return useQuery({
    queryKey: ['helia_daily', user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from('helia_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('role', 'user')
        .gte('created_at', `${today}T00:00:00.000Z`)
      return count ?? 0
    },
  })
}

function useHeliaHistory() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['helia_history', user?.id],
    enabled: !!user,
    staleTime: Infinity, // load once per page session
    queryFn: async () => {
      const { data } = await supabase
        .from('helia_messages')
        .select('id, role, content, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(40)
      return ((data ?? []).reverse()) as { id: string; role: string; content: string; created_at: string }[]
    },
  })
}

// ── Main hook ────────────────────────────────────────────────────────

export function useHeliaChat() {
  const { session, profile } = useAuth()
  const isPremium = profile?.plan === 'premium'
  const { data: dailyCount = 0, refetch: refetchCount } = useDailyMessageCount()
  const { data: dbHistory, isLoading: isHistoryLoading } = useHeliaHistory()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const initializedRef = useRef(false)

  // Initialize messages from DB history once it loads
  useEffect(() => {
    if (isHistoryLoading || initializedRef.current) return
    initializedRef.current = true

    if (!dbHistory?.length) {
      setMessages([WELCOME])
      return
    }

    setMessages(
      dbHistory.map(h => ({
        id: h.id,
        role: h.role as 'user' | 'assistant',
        content: h.content,
        created_at: h.created_at,
      }))
    )
  }, [dbHistory, isHistoryLoading])

  const canSend = isPremium || dailyCount < FREE_DAILY_LIMIT

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming || !session) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    // Build history from current state (captures DB history + this session)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .slice(-14)
      .map(m => ({ role: m.role, content: m.content }))

    const assistantId = `a-${Date.now()}`
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ])

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/helia-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: text, history }),
        }
      )

      if (res.status === 429) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: '🔒 Atingiste o limite de 5 mensagens hoje. Upgrade Premium para conversas ilimitadas.', streaming: false }
              : m
          )
        )
        refetchCount()
        return
      }

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          if (raw === '[DONE]') {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, streaming: false, created_at: new Date().toISOString() }
                  : m
              )
            )
            refetchCount()
            return
          }
          try {
            const { delta, error } = JSON.parse(raw)
            if (error) throw new Error(error)
            if (delta) {
              accumulated += delta
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              )
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Ocorreu um erro. Tenta novamente.', streaming: false }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [messages, isStreaming, session, refetchCount])

  return { messages, sendMessage, isStreaming, isHistoryLoading, canSend, dailyCount, isPremium }
}
