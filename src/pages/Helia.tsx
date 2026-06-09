import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useHeliaChat, FREE_DAILY_LIMIT, type ChatMessage } from '@/hooks/useHeliaChat'
import { cn } from '@/lib/utils'

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
}

function isSameDay(a?: string, b?: string): boolean {
  if (!a || !b) return true // treat undefined as "same" to avoid spurious separators
  return new Date(a).toDateString() === new Date(b).toDateString()
}

export default function Helia() {
  const { messages, sendMessage, isStreaming, isHistoryLoading, canSend, dailyCount, isPremium } =
    useHeliaChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || !canSend) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  return (
    <div className="flex h-svh flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 px-5 pt-10 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sunflower/20 text-xl">
            🌻
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground leading-tight">Helia</h1>
            <p className="font-body text-xs text-muted-foreground">A tua companheira de crescimento</p>
          </div>
          {!isPremium && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <span className="font-body text-xs text-muted-foreground">
                {dailyCount}/{FREE_DAILY_LIMIT}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isHistoryLoading ? (
          /* Loading skeleton */
          <div className="space-y-4 pt-2">
            {[80, 120, 60, 100].map((w, i) => (
              <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                <div
                  className="animate-pulse rounded-2xl bg-muted"
                  style={{ width: `${w}px`, height: '40px' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const prev = messages[idx - 1] as ChatMessage | undefined
              const showSeparator = msg.created_at && !isSameDay(msg.created_at, prev?.created_at)

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showSeparator && msg.created_at && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="font-body text-xs text-muted-foreground">
                        {dateLabel(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mr-2 mt-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-sunflower/20 text-sm">
                        🌻
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[78%] rounded-2xl px-4 py-3 font-body text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-sunflower text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
                      )}
                    >
                      {msg.content
                        ? msg.content.split('\n').map((line, i, arr) => (
                            <span key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </span>
                          ))
                        : null}
                      {msg.streaming && (
                        <span className="inline-flex gap-0.5 ml-1 align-middle">
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3 safe-area-bottom">
        {!canSend ? (
          <Link
            to="/premium"
            className="flex items-center justify-center gap-2 rounded-2xl bg-sunflower/10 px-4 py-3 transition-colors hover:bg-sunflower/20"
          >
            <Lock className="h-4 w-4 text-sunflower-dark" />
            <p className="font-body text-sm font-medium text-sunflower-dark">
              Limite diário atingido · Upgrade Premium →
            </p>
          </Link>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Fala com a Helia…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || isHistoryLoading}
              className="flex-1 resize-none rounded-2xl border border-input bg-muted/50 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 leading-relaxed"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming || isHistoryLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunflower text-primary-foreground transition-all active:scale-95 disabled:opacity-40 hover:bg-sunflower-dark"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
