import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <h1 className="font-display text-6xl font-bold text-sunflower">404</h1>
      <p className="font-body text-muted-foreground">Esta página não existe.</p>
      <Button asChild variant="warm">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}
