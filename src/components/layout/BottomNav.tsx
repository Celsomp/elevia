import { NavLink } from 'react-router-dom'
import { Sun, Timer, BookOpen, BarChart2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/home',         icon: Sun,          label: 'Início' },
  { to: '/focus',        icon: Timer,        label: 'Foco' },
  { to: '/reflections',  icon: BookOpen,     label: 'Reflexões' },
  { to: '/history',      icon: BarChart2,    label: 'Histórico' },
  { to: '/helia',        icon: MessageCircle, label: 'Helia' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 font-body text-[10px] transition-colors',
                isActive
                  ? 'text-sunflower-dark'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
