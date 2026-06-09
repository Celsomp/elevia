import { Bell } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { cn } from '@/lib/utils'

export function PushBell() {
  const { permission, subscribed, subscribe, loading, supported } = usePushNotifications()

  if (!supported || permission === 'denied') return null

  const isActive = subscribed && permission === 'granted'

  return (
    <button
      onClick={!isActive ? subscribe : undefined}
      disabled={loading || isActive}
      aria-label={isActive ? 'Notificações ativas' : 'Ativar notificações diárias'}
      className={cn(
        'relative mt-0.5 flex h-9 w-9 items-center justify-center rounded-full transition-all',
        !isActive && 'hover:bg-sunflower/10 active:scale-95 cursor-pointer'
      )}
    >
      {isActive ? (
        <Bell className="h-5 w-5 text-sunflower-dark" fill="currentColor" />
      ) : (
        <>
          <Bell className="h-5 w-5 text-muted-foreground" />
          {permission === 'default' && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-sunflower" />
          )}
        </>
      )}
    </button>
  )
}
